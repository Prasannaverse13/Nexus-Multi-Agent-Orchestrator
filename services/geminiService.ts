
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AgentRole, TaskStep, AgentStatus } from "../types";

const API_KEY = process.env.API_KEY || "";

export class AgentService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  async connectLiveOrchestrator(onMessage: (text: string) => void) {
    return this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => console.log("A2A Control Plane Online"),
        onmessage: (message) => {
          if (message.serverContent?.outputTranscription) {
            onMessage(message.serverContent.outputTranscription.text);
          }
        },
        onclose: () => console.log("A2A Control Plane Offline"),
        onerror: (e) => console.error("ADK Socket Fault", e),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        systemInstruction: "You are the A2A Control Plane. You summarize the ongoing dialogue between Researcher, Coder, Analyst, and Critic agents as they solve the user's request."
      }
    });
  }

  async adkIntake(prompt: string) {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `A2A_OS_KERNEL: Verify input. Output a dialogue message for the system log. Initiate handshake for Researcher, Coder, Analyst swarm.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            needs_clarification: { type: Type.BOOLEAN },
            questions: { type: Type.ARRAY, items: { type: Type.STRING } },
            contract_valid: { type: Type.BOOLEAN },
            dialogue: { type: Type.STRING, description: "Message to the user/system about the intake status." }
          },
          required: ["needs_clarification", "questions", "contract_valid", "dialogue"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  }

  async adkPlan(prompt: string) {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `ADK_PLANNER: Define the execution graph. Use roles like RESEARCHER for data gathering, CODER for processing, ANALYST for insights, and CRITIC for verification. If the user asks for visualization or charts, ensure the ANALYST or CODER task includes generating numerical data.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            execution_graph: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  tool: { type: Type.STRING },
                  prompt: { type: Type.STRING },
                  dependencies: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["id", "tool", "prompt", "dependencies"]
              }
            },
            planner_dialogue: { type: Type.STRING, description: "Detailed conversation between Planner and Orchestrator about the swarm roles." }
          },
          required: ["execution_graph", "planner_dialogue"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  }

  async adkExecuteTool(step: TaskStep, memory: string) {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `MEMORY: ${memory}\nTASK: ${step.description}`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `You are the ${step.agent} agent. Analyze context and task. IMPORTANT: If the task involves trends, sales, or data, you MUST populate the 'chart_data' object with relevant labels and values. Provide a high-fidelity 'handshake_message' explaining your findings to the Orchestrator.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            output: { type: Type.STRING },
            handshake_message: { type: Type.STRING },
            chart_data: {
              type: Type.OBJECT,
              properties: {
                labels: { type: Type.ARRAY, items: { type: Type.STRING } },
                values: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                title: { type: Type.STRING }
              },
              required: ["labels", "values", "title"]
            },
            confidence: { type: Type.NUMBER }
          },
          required: ["output", "handshake_message", "confidence"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  }

  async adkVerify(step: TaskStep, result: any, sourceData: string) {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `RESULT: ${JSON.stringify(result)}\nSOURCE: ${sourceData}`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `You are the CRITIC agent. Verify outputs for accuracy. Output a 'critic_dialogue' message explaining the logic check performed.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            is_valid: { type: Type.BOOLEAN },
            issues: { type: Type.ARRAY, items: { type: Type.STRING } },
            critic_dialogue: { type: Type.STRING }
          },
          required: ["is_valid", "issues", "critic_dialogue"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  }

  async adkAggregate(prompt: string, memory: string) {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `FULL_CONTEXT: ${memory}`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `ADK_AGGREGATOR: Consolidate swarm insights from Researcher, Coder, and Analyst into a final verified report. 
        MANDATORY: Return a structured JSON block including key_metrics and artifacts. 
        Summary should be concise but professional.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            summary: { type: Type.STRING },
            key_metrics: {
              type: Type.OBJECT,
              properties: {
                labels: { type: Type.ARRAY, items: { type: Type.STRING } },
                values: { type: Type.ARRAY, items: { type: Type.NUMBER } }
              }
            },
            final_answer: { type: Type.STRING, description: "The final human-readable report string." },
            chart_data: {
              type: Type.OBJECT,
              properties: {
                labels: { type: Type.ARRAY, items: { type: Type.STRING } },
                values: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                title: { type: Type.STRING }
              }
            },
            artifacts: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidence: { type: Type.NUMBER }
          },
          required: ["final_answer", "status", "summary", "artifacts", "confidence"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  }
}

export const agentService = new AgentService();
