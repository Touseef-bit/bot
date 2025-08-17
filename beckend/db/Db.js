// import "reflect-metadata";
// import { DataSource } from "typeorm";
// import { DocumentEntity } from "../Entity/entity.js";

// // const AppDataSource = new DataSource({
// //   type: "mysql",
// //   host: "localhost",
// //   port: 3306,
// //   username: "root",
// //   password: "",
// //   database: "ragdb",
// //   synchronize: true, 
// //   entities: [DocumentEntity],
// // });

// const AppDataSource = {
//   connectionOptions: {
//     type: "mariadb",
//     host: "127.0.0.1",
//     port: 3306,
//     user: "root",
//     password: "",
//     database: "ragdb",
//   },
//   distanceStrategy: "EUCLIDEAN",
// };

// export default AppDataSource

// db.js
import mysql from "mysql2/promise";

const config = {
  connectionOptions: {
    host: "localhost",
    port: 3306,
    user: "root",      
    password: "",
    database: "ragdb",
  },
  distanceStrategy: "EUCLIDEAN",
};

export default config;
