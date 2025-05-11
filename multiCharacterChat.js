import { fractionScenario } from './problems/fractions-grade3.js';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const chatArea = document.getElementById("chatArea");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const scenarioTitle = document.getElementById("scenarioTitle");

scenarioTitle.textContent = `📘 상황: ${fractionScenario.title}`;

// 대화 메시지 저장 배열
let messages = [
    {
    role: "system",
    content: `
    당신은 다음 네 명의 가상 학생입니다:

    - 민지: 처음에는 도형이 세 부분으로 나뉘었다고 생각해서 1/3이라고 말하지만, 친구들과 교사의 발문을 통해 점차 1/4이 맞다는 것을 이해해갑니다.
    - 준호: 도형이 네 개의 같은 크기 조각으로 나뉘었다고 보고 처음부터 1/4이 정답이라고 주장합니다.
    - 유진: 친구들의 생각을 잘 요약하고 설명해주며 대화의 흐름을 돕습니다.
    - 소율: 조용히 듣다가 나중에 반성적으로 개념을 정리하며 발언합니다.

    교사의 질문에 대해 각 학생은 자신의 성격과 사고 과정에 따라 발화하며, 다음 형식으로 응답합니다:

    민지: ...
    준호: ...
    유진: ...
    소율: ...

    대화에 참여할 학생은 1~3명으로 다양할 수 있습니다.`
    },
  {
    role: "user",
    content: fractionScenario.prompt
  }
];

// GPT 응답 요청
async function fetchGptResponse() {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4-turbo",
      messages,
      temperature: 0.7
    })
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content.trim() || "(응답 없음)";
}

// 첫 질문에 대한 초기 GPT 응답
(async () => {
  const reply = await fetchGptResponse();
  const characterMessages = parseCharacterResponses(reply);
  messages.push(...characterMessages);
  updateChat();
})();

// 사용자 입력 처리
sendBtn.addEventListener("click", async () => {
  const input = userInput.value.trim();
  if (!input) return;

  messages.push({ role: "user", content: input });
  updateChat();
  userInput.value = "";

  const reply = await fetchGptResponse();
  const characterMessages = parseCharacterResponses(reply);
  messages.push(...characterMessages);
  updateChat();
});

// GPT 응답 파싱: "이름: 말" 형태 분리
function parseCharacterResponses(reply) {
  const lines = reply.split("\n").filter(line => line.includes(":"));
  return lines.map(line => {
    const [name, ...rest] = line.split(":");
    return {
      role: "assistant",
      character: name.trim(),
      content: rest.join(":").trim()
    };
  });
}

// 대화 업데이트 렌더링
function updateChat() {
  chatArea.innerHTML = messages
    .filter(msg => msg.role !== "system")
    .map(msg => {
      if (msg.role === "user") {
        return `<b>👩‍🏫 교사:</b> ${msg.content}`;
      } else {
        const icon = msg.character === "준호" ? "👦" : "👧";
        return `<b>${icon} ${msg.character}:</b> ${msg.content}`;
      }
    })
    .join("<br><br>");
}
