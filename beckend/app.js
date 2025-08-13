import express from "express";
import dotenv from "dotenv";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AppDataSource } from "./db/Db";
import crypto from "crypto";
dotenv.config()

const app = express()
const PORT = 3000

export function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}
const model = new ChatGoogleGenerativeAI({
  apiKey:process.env.OPEN_AI_KEY,
  model:"gemini-1.5-flash",
  temperature:0.7
})

await AppDataSource.initialize();
const repo = AppDataSource.getRepository("Document");

const loader = new CheerioWebBaseLoader("https://thecodingbuzz.com/");
const docs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const splitDocs = await splitter.splitDocuments(docs);

for (const doc of splitDocs) {
  const hash = hashText(doc.pageContent)

  if (await repo.findOne({ where: { hash } })) continue;

  const vector = await embeddings.embedQuery(doc.pageContent);

  await repo.save({
    hash,
    content: doc.pageContent,
    embedding: JSON.stringify(vector),
  });
}
app.get("/",async(req,res)=>{
})
app.listen(PORT,()=>{
  console.log(`Server running at Port ${PORT}`)
})