import { marked } from 'marked';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const assistantId = import.meta.env.VITE_OPENAI_ASSISTANT_ID;

const inputText = document.getElementById("inputText");
const getFeedbackBtn = document.getElementById("getFeedbackBtn");
const result = document.getElementById("result");

const feedbackPrompt = `
다음은 교사와 학생의 대화 또는 수업 기록입니다. 
첨부한 문서에 수록된 TMSSR Framework의 내용을 바탕으로, 사용자와 가상의 학생 사이에 이루어진 대화를 분석하여 피드백을 제공해줘.
표 형태로 정리해줘도 좋을 것 같아

피드백에는 다음이 반드시 포함되어야 해:
1. TMSSR Framework의 네 가지 요소(Eliciting, Responding, Facilitating, Extending)에 따라 교사의 발화나 상호작용을 분류하고 해석할 것
2. 교사의 발문이나 피드백 방식이 학생의 수학적 사고에 어떤 영향을 미치는지 평가할 것
3. TMSSR Framework를 바탕으로 더 효과적인 교수 전략을 구체적으로 제안할 것

중요:
- 피드백은 반드시 **마크다운 형식**으로 작성해줘
- 학생과 교사의 대화를 그대로 반복하거나 인용하지 말고, 핵심 내용을 요약하고 분석 중심으로 작성해줘
- 첨부된 문서의 내용을 참고하여 TMSSR Framework에 기반한 분석을 명확히 반영해줘
`;

// 요청 함수
async function getAssistantFeedback(userText) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "OpenAI-Beta": "assistants=v2"
  };

  // 1️⃣ Thread 생성
  const threadRes = await fetch("https://api.openai.com/v1/threads", {
    method: "POST",
    headers
  });
  const threadData = await threadRes.json();
  const threadId = threadData.id;

  // 2️⃣ 메시지 추가
  await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      role: "user",
      content: `${feedbackPrompt}\n\n${userText}`
    })
  });

  // 3️⃣ Run 실행
  const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      assistant_id: assistantId,
      instructions: "출력은 반드시 한국어 마크다운 형식으로 작성해주세요."
    })
  });
  const runData = await runRes.json();
  const runId = runData.id;

  // 4️⃣ 상태 확인
  let status = runData.status;
  while (status !== "completed") {
    await new Promise(r => setTimeout(r, 1000));
    const statusRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
      headers
    });
    const statusData = await statusRes.json();
    status = statusData.status;
    if (status === "failed") throw new Error("GPT 실행 실패");
  }

  // 5️⃣ 응답 메시지 가져오기
  const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    headers
  });
  const messagesData = await messagesRes.json();

  const assistantMessages = messagesData.data.filter(msg => msg.role === "assistant");
  const rawText = assistantMessages.map(m => m.content[0].text.value).join("\n");

  const cleanText = rawText.replace(/【.*?†.*?】/g, '');
  return cleanText;
}

// 버튼 이벤트 연결
getFeedbackBtn.addEventListener("click", async () => {
  const text = inputText.value.trim();
  if (!text) {
    alert("텍스트를 입력하세요.");
    return;
  }

  result.innerHTML = "⏳ 피드백 생성 중...";
  try {
    const feedback = await getAssistantFeedback(text);
    result.innerHTML = marked.parse(feedback); // ✅ 마크다운 렌더링
    if (window.MathJax) MathJax.typeset(); // ✅ 수식도 함께 렌더링
  } catch (err) {
    console.error("오류:", err);
    result.textContent = "⚠️ 피드백 생성에 실패했습니다.";
  }
});

inputText.value = `<대화1> 
(초등학교 3학년 학생들이 이 1/5이고 분수임을 학습했다. 이후 교사는 을 화면에 제시한다.)  

교사: 얘들아, 지금 화면에 보이는 이 그림을 보자. 이 큰 사각형에서, 회색으로 칠해진 부분은 전체의 몇 분의 몇일까? 각자 생각해보고, 공책에 숫자랑 이유를 적어보자.
(잠시 후) 이제 모둠 친구들과 이야기해도 좋아. 서로의 생각을 나눠보렴.

(민지, 유진, 준호, 소율이 있는 네 사람 모둠. 교사가 조용히 다가온다.)
교사: 어떤 이야기 나누고 있었니?
민지: 저는... 1/3 같아요. [여기까지 상황제시]

교사: 너 틀렸어 정답은 1/4이야 다음 문제 다시 풀어볼래?`;
