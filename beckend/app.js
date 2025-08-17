import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import AppDataSource from "./db/Db.js";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PromptTemplate } from "@langchain/core/prompts";
import {
  MariaDBStore,
} from "@langchain/community/vectorstores/mariadb";
import config from "./db/Db.js";
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_AI_KEY,
  model: "embedding-001",
});

const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_KEY,
  model: "gemini-1.5-pro",
});

async function insertDocument(content, metadata = {}) {
  const [vector] = await embeddings.embedDocuments([content]);
  await pool.query(
    "INSERT INTO documents (content, embedding, metadata) VALUES (?, ?, ?)",
    [content, JSON.stringify(vector), JSON.stringify(metadata)]
  );
}


const prompt = new PromptTemplate({
  template: `You are a helpful AI assistant. Use the context below to answer the question.

Context:
{context}

Question:
{question}

Answer:`,
  inputVariables: ["context", "question"],
});

let vectorStore;

(async () => {
  try {
    const vectorStore = await MariaDBStore.initialize(
      embeddings,
      config
    );
    await vectorStore.ensureTableInDatabase();
    console.log("✅ Vector store ready");

    const count = await vectorStore.store.count();
    if (count === 0) {
      console.log("⏳ Loading Wikipedia data...");
      const loader = new CheerioWebBaseLoader("https://en.wikipedia.org/wiki/Artificial_intelligence");
      const docs = await loader.load();

      const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
      const chunks = await splitter.splitDocuments(docs);
      await vectorStore.addDocuments(chunks);
      console.log("✅ Wikipedia data stored in DB");
    }
  } catch (error) {
    console.log(error.message)
  }

})();

// function cosineSimilarity(vecA, vecB) {
//   const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
//   const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
//   const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
//   return dot / (normA * normB || 1);
// }

// async function search(query, topK = 1) {
//   const queryVector = await embeddings.embedQuery(query);
//   const allDocs = await docRepo.find();

//   const values = allDocs.map((doc) => {
//     let vector = [];
//     try {
//       vector = JSON.parse(doc.embedding || "[]");
//     } catch (err) {
//       console.error("Error parsing embedding for doc id", doc.id, err);
//       vector = [];
//     }

//     return {
//       ...doc,
//       value: vector.length ? cosineSimilarity(queryVector, vector) : -Infinity,
//     };
//   });

//   return values.sort((a, b) => b.value - a.value).slice(0, topK);
// }

app.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    const results = await vectorStore.similaritySearch(message, 1);
    const context = results.map(r => r.pageContent).join("\n");

    const finalPrompt = await prompt.format({ context, question: message });

    const response = await llm.invoke(finalPrompt);

    res.json({
      question: message,
      answer: response.content,
      sources: results.map(r => ({ metadata: r.metadata, preview: r.pageContent.slice(0, 200) }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at Port ${PORT}`);
});
