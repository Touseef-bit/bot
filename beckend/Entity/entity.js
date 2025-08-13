// entities/DocumentEntity.js
import { EntitySchema } from "typeorm";

export const DocumentEntity = new EntitySchema({
  name: "Document",
  columns: {
    id: { primary: true, type: "int", generated: true },
    hash: { type: "varchar", unique: true },
    content: { type: "text" },
    embedding: { type: "longtext" }, // store as JSON string
  },
});
