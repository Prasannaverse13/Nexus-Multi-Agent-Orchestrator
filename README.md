# Nexus Multi-Agent Orchestrator

## 1. Project Overview
The **Nexus Multi-Agent Orchestrator** is a specialized AI system designed to decompose high-level, ambiguous business requests into executable sub-tasks handled by a swarm of autonomous agents. 

In real-world enterprise environments, monolithic LLM calls often fail at complex reasoning or data-heavy tasks due to context window saturation and reasoning "drift." This system solves that by implementing an **Agent-to-Agent (A2A)** architecture where specialized workers (Planner, Coder, Analyst, Critic) collaborate over a shared state, mimicking a high-performing engineering team.

## 2. System Architecture
The system follows a **Modular Agentic Workflow** pattern, built on the **Google Agent Development Kit (ADK)** principles and powered by **Gemini 3 Pro/Flash**.

- **Orchestration Layer:** A TypeScript-based state machine that manages transitions between the Intake, Planning, Execution, and Aggregation phases.
- **Injected Context (RAG):** Supports document injection (CSV/TXT) which is parsed and mapped into the agents' shared memory.
- **A2A Control Plane:** Utilizes the Gemini 3 Multimodal Live API to provide a real-time "heartbeat" and summary of agent dialogue, ensuring low-latency observability.
- **Tech Choice:** **TypeScript** was selected for its type-safety, which is critical when managing complex JSON handshakes between agents to prevent runtime schema mismatches.

  <img width="3043" height="2602" alt="Nexus End-to-End Vertical Flow" src="https://github.com/user-attachments/assets/caafca62-fa62-491f-82fc-71e5d1265afe" />


## 3. Agent Design
Each agent is governed by a strict System Instruction (System Prompt) that defines its operational boundaries:

| Agent | Responsibility | Key Feature |
| :--- | :--- | :--- |
| **Orchestrator** | State management and user interface. | Handles the A2A neural link. |
| **Planner** | Decomposes requests into an Execution Graph. | Dependency mapping. |
| **Coder** | Data processing, computation, and logic. | Tool execution (simulated). |
| **Analyst** | Interprets results and generates visual data. | Numerical trend extraction. |
| **Critic** | Out-of-band validation and logic checking. | Hallucination prevention. |

**Context Sharing:** Agents share a "Shared Memory" block. Each agent receives the original prompt plus the verified outputs of all previous agents in the chain.

## 4. Orchestration & Execution Flow
1. **Intake & Kernel Check:** The system validates the "contract." If the prompt is ambiguous, the system triggers a clarification loop.
2. **Strategy Synthesis:** The Planner generates a DAG (Directed Acyclic Graph) of tasks.
3. **Serial/Parallel Execution:** Workers are initialized. Before any worker's output is committed to Shared Memory, it must pass through the **Critic**.
4. **Final Aggregation:** The Aggregator agent compiles verified worker outputs into a structured JSON payload.

## 5. Safety, Reliability & Hallucination Prevention
To ensure production-grade reliability, we implemented:
- **The Critic Pattern:** A mandatory verification step where a separate model instance checks the worker's output against the source data.
- **Schema Enforcement:** All agent outputs are strictly typed via JSON schemas.
- **Grounded Clarification:** If a task requires data not present in the "Source Block," agents are instructed to flag the missing dependency rather than inventing values.

## 6. Visibility & Observability
Autonomous systems can be "black boxes." We prioritize transparency via:
- **Live A2A Stream:** A real-time transcript of background agent communication.
- **Log Categorization:** 
    - `THOUGHT_LOG`: Internal agent reasoning.
    - `ACTION_LOG`: External tool calls or delegations.
    - `VERIFICATION_LOG`: Critic logic checks.
- **Metadata Payloads:** Final responses include confidence scores and artifact manifests.

## 7. Example Workflow
**User Input:** *"Analyze the last 4 quarters of sales data from the attached CSV and identify the peak growth period."*

**Structured Output (JSON):**
```json
{
  "status": "completed",
  "summary": "Sales trend analysis completed for FY24.",
  "final_answer": "Growth peaked in Q3 at 18.5%...",
  "key_metrics": {
    "labels": ["Q1", "Q2", "Q3", "Q4"],
    "values": [120, 145, 180, 165]
  },
  "artifacts": ["sales_trend_v1.json", "growth_chart.png"],
  "confidence": 0.94
}
```

## 8. Trade-offs & Design Decisions
- **Simplified Tooling:** For this 24h challenge, the "Coder" agent simulates Python execution via structured reasoning rather than a sandboxed Docker environment.
- **State Management:** Current state is volatile (in-memory). For production, this would be backed by a Redis/Postgres persistence layer to support long-running tasks.
- **UI vs. Backend:** The UI is a functional "Developer Dashboard." Focus was placed on the robustness of the JSON handshake between agents over CSS animations.

## 9. How to Run the Project
1. **Prerequisites:** Node.js v18+, Google Gemini API Key.
2. **Setup:**
   - Clone the repository.
   - Set environment variable: `export GEMINI_API_KEY='your_gemini_key'` or create a `.env` file.
   - Run `npm install` and `npm run dev`.
3. **Testing:** Upload a CSV of sales data and request a "Quarterly trend summary."

## 10. Future Improvements
- **Persistence:** Support for `sessionId` to resume interrupted swarm executions.
- **Multi-Turn Refinement:** Allowing the user to "interrupt" the Planner to modify the strategy.
- **Horizontal Scaling:** Deploying worker agents as independent microservices to handle massive parallel execution graphs.
