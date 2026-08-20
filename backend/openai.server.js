import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import chatRouter from "./routes/chat.js";
import advisorRouter from "./routes/ai-advisor.js";
import simulationRouter from "./routes/simulation.js";


const app = express();

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
    res.json({
        status: "Simorgh AI Backend Running 🚀"
    });
});


app.use("/api/chat", chatRouter);
app.use("/api/advisor", advisorRouter);
app.use("/api/simulation", simulationRouter);


const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});