import express from "express";
import dotenv from "dotenv";
import {
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import AppDataSource from "./db/Db.js";
import crypto from "crypto";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { DocumentEntity } from "./Entity/entity.js";
import { BasePromptTemplate } from "langchain/prompts";
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_AI_KEY, 
  model: "embedding-001",              
});


const prompt = new BasePromptTemplate({
  template,
  inputVariables: ["question"]
});

await AppDataSource.initialize();
const docRepo = AppDataSource.getRepository(DocumentEntity);

// --- Ingest ONCE at startup (recommended) ---
const loader = new CheerioWebBaseLoader("https://en.wikipedia.org/wiki/Artificial_intelligence");
const docs = await loader.load();
const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
const chunks = await splitter.splitDocuments(docs);

for (const chunk of chunks) {
  const hash = hashText(chunk.pageContent);
  const exists = await docRepo.findOne({ where: { hash } });
  if (exists) continue;

  const vector = await embeddings.embedQuery(chunk.pageContent);

  const newDoc = docRepo.create({
    hash,
    content: chunk.pageContent,
    embedding: JSON.stringify(vector),  
  });
  await docRepo.save(newDoc);
}

function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (normA * normB || 1);
}

async function search(query, topK = 1) {
  const queryVector = await embeddings.embedQuery(query);
  const allDocs = await docRepo.find();

  const values = allDocs.map((doc) => {
    let vector = [];
    try {
      vector = JSON.parse(doc.embedding || "[]"); 
    } catch (err) {
      console.error("Error parsing embedding for doc id", doc.id, err);
      vector = [];
    }

    return {
      ...doc,
      value: vector.length ? cosineSimilarity(queryVector, vector) : -Infinity,
    };
  });

  return values.sort((a, b) => b.value - a.value).slice(0, topK);
}
// ---- routes ----
app.post("/", async (req, res) => {
  try {
    const message = req.body.message; 
    const promptsMessage = await prompt.format({ question: message });
    console.log(promptsMessage)
    if (!message) return res.status(400).json({ error: "message is required" });

    const results = await search(promptsMessage);
    res.json(
      results.map(r => ({
        id: r.id,
        hash: r.hash,
        preview: r.content,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at Port ${PORT}`);
});
