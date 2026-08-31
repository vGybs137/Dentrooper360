import {
  addColumns,
  schemaMigrations,
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
  ],
});
