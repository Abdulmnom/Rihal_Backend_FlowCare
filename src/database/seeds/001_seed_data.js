const bcrypt = require('bcryptjs');



//  Only for testing
/**
 * Idempotent seed data for FlowCare.
 * Uses INSERT ... ON CONFLICT DO NOTHING to safely re-run.
 * @param {import('knex')} knex
 */
exports.seed = async function (knex) {
    // --- Branches ---
    const branches = [
        { name: 'Muscat Main Branch', address: 'Al Qurum, Way 3012', city: 'Muscat', phone: '+968-2456-0001' },
        { name: 'Salalah Branch', address: 'Al Saada Street', city: 'Salalah', phone: '+968-2329-0002' },
        { name: 'Sohar Branch', address: 'Al Multaqa Street', city: 'Sohar', phone: '+968-2684-0003' },
    ];

    for (const branch of branches) {
        await knex.raw(
            `INSERT INTO branches (name, address, city, phone)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (name) DO NOTHING`,
            [branch.name, branch.address, branch.city, branch.phone]
        );
    }

    // Get branch IDs
    const branchRows = await knex('branches').select('id', 'name');
    const branchMap = {};
    branchRows.forEach((b) => (branchMap[b.name] = b.id));

    // --- Service Types ---
    const serviceTypes = [
        { name: 'General Consultation', description: 'Standard walk-in consultation', duration_minutes: 30 },
        { name: 'Document Processing', description: 'Document review and processing', duration_minutes: 45 },
        { name: 'Account Services', description: 'Account opening, closing, and modifications', duration_minutes: 20 },
        { name: 'Technical Support', description: 'Technical assistance and troubleshooting', duration_minutes: 60 },
    ];

    for (const st of serviceTypes) {
        await knex.raw(
            `INSERT INTO service_types (name, description, duration_minutes)
       VALUES (?, ?, ?)
       ON CONFLICT (name) DO NOTHING`,
            [st.name, st.description, st.duration_minutes]
        );
    }

    // --- Users ---
    const passwordHash = await bcrypt.hash('Password123!', 12);

    const users = [
        { full_name: 'System Admin', email: 'admin@flowcare.om', role: 'admin', branch_id: null },
        { full_name: 'Muscat Manager', email: 'manager.muscat@flowcare.om', role: 'branch_manager', branch_id: branchMap['Muscat Main Branch'] },
        { full_name: 'Salalah Manager', email: 'manager.salalah@flowcare.om', role: 'branch_manager', branch_id: branchMap['Salalah Branch'] },
        { full_name: 'Ahmed Al-Said', email: 'ahmed.staff@flowcare.om', role: 'staff', branch_id: branchMap['Muscat Main Branch'] },
        { full_name: 'Fatma Al-Harthy', email: 'fatma.staff@flowcare.om', role: 'staff', branch_id: branchMap['Salalah Branch'] },
        { full_name: 'Mohammed Al-Balushi', email: 'mohammed@customer.com', role: 'customer', branch_id: null },
        { full_name: 'Sara Al-Lawati', email: 'sara@customer.com', role: 'customer', branch_id: null },
    ];

    for (const user of users) {
        await knex.raw(
            `INSERT INTO users (full_name, email, phone, password_hash, role, branch_id)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (email) DO NOTHING`,
            [user.full_name, user.email, null, passwordHash, user.role, user.branch_id]
        );
    }

    // --- Staff ↔ Service Type assignments ---
    const staffRows = await knex('users').where('role', 'staff').select('id', 'email');
    const serviceTypeRows = await knex('service_types').select('id', 'name');
    const stMap = {};
    serviceTypeRows.forEach((s) => (stMap[s.name] = s.id));

    for (const staff of staffRows) {
        // Assign first two service types to each staff member
        for (const stName of ['General Consultation', 'Document Processing']) {
            if (stMap[stName]) {
                await knex.raw(
                    `INSERT INTO staff_service_types (staff_id, service_type_id)
           VALUES (?, ?)
           ON CONFLICT (staff_id, service_type_id) DO NOTHING`,
                    [staff.id, stMap[stName]]
                );
            }
        }
    }

    // --- System Settings ---
    const settings = [
        { key: 'slot_retention_days', value: '90', description: 'Number of days to retain soft-deleted slots before permanent purge' },
        { key: 'max_cancellations_per_day', value: '3', description: 'Maximum appointment cancellations allowed per customer per day' },
        { key: 'default_max_bookings_per_slot', value: '1', description: 'Default maximum number of bookings per slot' },
    ];

    for (const setting of settings) {
        await knex.raw(
            `INSERT INTO system_settings (key, value, description)
       VALUES (?, ?, ?)
       ON CONFLICT (key) DO NOTHING`,
            [setting.key, setting.value, setting.description]
        );
    }

    console.log('✅ Seed data imported successfully (idempotent).');
};
