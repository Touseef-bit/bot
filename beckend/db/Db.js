import "reflect-metadata";
import { DataSource } from "typeorm";
import { DocumentEntity } from "../Entity/entity";

export const AppDataSource = new DataSource({
  type: "mariadb",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "",
  database: "ragdb",
  synchronize: true, 
  logging: true,
  entities: [DocumentEntity],
});