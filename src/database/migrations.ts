import {
  addColumns,
  createTable,
  schemaMigrations,
  unsafeExecuteSql,
} from "@nozbe/watermelondb/Schema/migrations";

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: "patients",
          columns: [
            { name: "file_date", type: "number", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        addColumns({
          table: "patients",
          columns: [
            {
              name: "referral_patient_id",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
          ],
        }),
      ],
    },
    {
      toVersion: 4,
      steps: [
        addColumns({
          table: "patients",
          columns: [{ name: "referral_source", type: "string", isOptional: true }],
        }),
      ],
    },
    {
      toVersion: 5,
      steps: [
        unsafeExecuteSql("DROP INDEX IF EXISTS patients_referral_patient_id;"),
        unsafeExecuteSql(
          "ALTER TABLE patients DROP COLUMN referral_patient_id;",
        ),
        unsafeExecuteSql("DROP INDEX IF EXISTS payments_status;"),
        unsafeExecuteSql("ALTER TABLE payments DROP COLUMN status;"),
        unsafeExecuteSql("ALTER TABLE payments DROP COLUMN posted_date;"),
        unsafeExecuteSql("DROP INDEX IF EXISTS payments_is_posted;"),
        unsafeExecuteSql("ALTER TABLE payments DROP COLUMN is_posted;"),
      ],
    },
    {
      toVersion: 6,
      steps: [
        unsafeExecuteSql("ALTER TABLE patients DROP COLUMN vip_status_date;"),
        addColumns({
          table: "recalls",
          columns: [
            {
              name: "appointment_id",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
          ],
        }),
      ],
    },
    {
      toVersion: 7,
      steps: [
        createTable({
          name: "provider_working_hours",
          columns: [
            { name: "provider_id", type: "string", isIndexed: true },
            { name: "day_of_week", type: "number", isIndexed: true },
            { name: "start_hour", type: "string" },
            { name: "end_hour", type: "string" },
          ],
        }),
      ],
    },
  ],
});
