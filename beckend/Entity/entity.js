// entities/DocumentEntity.js
import { EntitySchema } from "typeorm";

export const DocumentEntity = new EntitySchema({
  name: "document",
  columns: {
    id: { primary: true, type: "int", generated: true },
    hash: { type: "varchar", unique: true },
    content: { type: "text" },
    embedding: { type: "longtext" }, 
  },
});
