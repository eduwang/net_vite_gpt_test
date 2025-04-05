// ✅ 환경변수에서 API 키 불러오기 (Vite 사용 시)
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

// ✅ DOM 요소 가져오기
const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
// ✅ 대화 내용을 저장할 배열 생성
const chatHistory = [];
//CSV 다운로드 버튼
const downloadBtnArea = document.getElementById('downloadBtnArea');


// ✅ GPT 응답 요청 함수 (챗봇용 프롬프트 포함)
async function fetchGPTResponse(prompt) {
  // ✅ system 프롬프트 + 전체 대화 히스토리 + 현재 질문을 합쳐서 전달
  const fullHistory = [
    { role: "system", content: gptSystemPrompt },
    ...chatHistory,
    { role: "user", content: prompt }
  ];

  const response = await fetch("/.netlify/functions/gptProxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4-turbo",
      messages: fullHistory,
      temperature: 0.6 // 답변의 창의성 정도 (0=고정, 1=창의적)
    }),
  });

  // ✅ 응답 처리
  const data = await response.json();

  // ✅ 여기에 방어 코드 추가
  if (!data.choices || !Array.isArray(data.choices) || !data.choices[0]) {
    throw new Error("GPT 응답 오류: " + JSON.stringify(data));
  }

  return data.choices[0].message.content;
}

// ✅ 버튼 클릭 시 GPT 호출 + UI에 출력
// ✅ 기존 버튼 클릭 이벤트 수정
sendBtn.addEventListener('click', async () => {
    const prompt = userInput.value.trim();
    if (!prompt) return;

      // ✅ 여기에 직접 fullHistory 생성해서 콘솔 출력
    const fullHistory = [
      { role: "system", content: gptSystemPrompt },
      ...chatHistory,
      { role: "user", content: prompt }
    ];

    console.log("🧪 GPT에 전달된 메시지 목록:");
    fullHistory.forEach((m, i) => {
      console.log(`${i + 1}. [${m.role}] ${m.content}`);
    });

  
    // 👤 사용자 메시지 출력 + 저장
    chatbox.innerHTML += `<div class="user-message">나: ${prompt}</div>`;
    chatHistory.push({ role: 'user', content: prompt }); // ⬅️ 저장
    userInput.value = '';
    chatbox.scrollTop = chatbox.scrollHeight;
  
    // 🤖 GPT 응답 가져오기
    const reply = await fetchGPTResponse(prompt);
  
    // 🤖 GPT 응답 출력 + 저장
    chatbox.innerHTML += `<div class="gpt-message">GPT: ${reply}</div>`;
    chatHistory.push({ role: 'assistant', content: reply }); // ⬅️ 저장
    chatbox.scrollTop = chatbox.scrollHeight;

    // ✅ 수식 렌더링
    if (window.MathJax) {
      MathJax.typeset();
    }
  });

// ✅ 엔터 키 입력 시 자동 전송
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendBtn.click(); // 버튼 클릭 기능 재사용
  }
});


//피드백 받기 버튼 작업//
// ✅ 피드백 버튼 요소 가져오기
const feedbackBtn = document.getElementById('feedbackBtn');

// // 평가 가이드라인
// const feedbackSystemPrompt = `
// 당신은 교사교육 전문가 입니다. 주어진 이미지 설명과 대화 내용을 분석하고, 
// 교사교육 전문가의 관점에서 피드백을 해줘.
// 피드백은 다음 기준을 따라야 합니다:
// 1. 학생이 어려워하는 개념을 구체적으로 지적하기
// 2. 개선 방법을 단계별로 제공하기
// 3. 교사가 어떤 방식으로 지도하면 좋을지 조언하기
// `;

//피드백용 GPT 호출 함수
async function fetchFeedbackFromGPT(history) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: feedbackSystemPrompt },
          ...history // 기존 대화 내용 그대로 전달
        ],
        temperature: 0.6
      }),
    });
  
    const data = await response.json();

    // ✅ 여기에 방어 코드 추가
    if (!data.choices || !Array.isArray(data.choices) || !data.choices[0]) {
      throw new Error("GPT 응답 오류: " + JSON.stringify(data));
    }

    return data.choices[0].message.content;
  }
  
// GPT 호출하여 피드백 생성
const feedbackArea = document.getElementById('feedbackArea');

feedbackBtn.addEventListener('click', async () => {
    feedbackArea.innerHTML = "<p>피드백 생성 중...</p>";
    downloadBtnArea.innerHTML = ""; // 이전 버튼 제거
  
    try {
      const feedback = await fetchFeedbackFromGPT(chatHistory);
  
      // 결과 표시
      feedbackArea.innerHTML = `
        <h3 style="font-weight:600; margin-bottom: 0.5rem;">🧑‍🏫 GPT 피드백</h3>
        <p>${feedback.replace(/\n/g, "<br>")}</p>
      `;
            
      // ✅ 수식 렌더링 트리거
      if (window.MathJax) {
        MathJax.typeset();
      }
  
      // ✅ 콘솔 출력 시작
      console.log("🧠 [개발자용 디버그 로그]");
      console.log("1️⃣ 사용된 GPT 시스템 프롬프트:");
      console.log(gptSystemPrompt);
      console.log("2️⃣ 사용된 피드백 시스템 프롬프트:");
      console.log(feedbackSystemPrompt);
  
      console.log("3️⃣ 대화 히스토리:");
      chatHistory.forEach((entry, i) => {
        console.log(`${i + 1}. [${entry.role}] ${entry.content}`);
      });
  
      console.log("4️⃣ 생성된 GPT 피드백:");
      console.log(feedback);

      // ✅ 결과 저장 버튼 생성
      const saveBtn = document.createElement("button");
      saveBtn.textContent = "📥 결과 저장하기 (CSV)";
      saveBtn.style = "margin-top: 1rem; padding: 0.5rem 1rem; background-color: #4b5563; color: white; border: none; border-radius: 0.375rem; cursor: pointer;";

      saveBtn.addEventListener('click', () => {
          downloadCSV(feedback);
      });

      downloadBtnArea.appendChild(saveBtn);
      downloadBtnArea.style.display = "inline";
  
    } catch (error) {
      feedbackArea.innerHTML = "<p>⚠️ 피드백 생성에 실패했습니다.</p>";
      console.error("피드백 오류:", error);
    }
  });
  



// CSV 생성을 위한 함수
function downloadCSV(data) {
    const csvHeader = ["학생 역할 프롬프트", "피드백용 프롬프트", "대화내용", "피드백 결과"];
    const csvRows = [
      [
        `"${gptSystemPrompt.replace(/"/g, '""')}"`,
        `"${feedbackSystemPrompt.replace(/"/g, '""')}"`,
        `"${chatHistory.map(c => `[${c.role}] ${c.content}`).join('\n').replace(/"/g, '""')}"`,
        `"${data.replace(/"/g, '""')}"`
      ]
    ];
  
    const csvContent =
      csvHeader.join(",") + "\n" +
      csvRows.map(row => row.join(",")).join("\n");
  
    // ✅ 한글 깨짐 방지를 위한 BOM(UTF-8 서명) 추가
    const BOM = "\uFEFF"; // UTF-8 BOM
    
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "GPT_feedback_log.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  
// 이미지 캐러셀
// 이미지 목록 (이미지 경로들을 여기에 배열로 추가)
const images = [
  "/public/Imgs/test_1.png",
  "/public/Imgs/test_2.png",
  "/public/Imgs/test_3.png"
];

let currentIndex = 0;

const carouselImage = document.getElementById("carouselImage");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

prevBtn.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  carouselImage.src = images[currentIndex];
});

nextBtn.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % images.length;
  carouselImage.src = images[currentIndex];
});







// 개발자용 기능 설정
// ✅ 전역 프롬프트 변수 (기본값)
let gptSystemPrompt = 
'너는 이차방정식을 잘 이해하지 못하는 중학생이야. 교사가 질문하면 아는 만큼 솔직하게 대답하고, 모르면 "잘 모르겠어요" 또는 "조금 헷갈려요"라고 말해. 너는 정답을 알려주려 하기보다는, 배우는 입장에서 생각을 말하려고 해. 틀릴 수도 있어. 교사가 도와주면 따라가려고 노력하는 자세야. 수식은 가능한 한 LaTeX 형식으로 표현해줘. 예: \[ x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} \]';
let feedbackSystemPrompt = `당신은 교사교육 전문가 입니다. 주어진 이미지 설명과 대화 내용을 분석하고, 
교사교육 전문가의 관점에서 피드백을 해줘.
피드백은 다음 기준을 따라야 합니다:
1. 학생이 어려워하는 개념을 구체적으로 지적하기
2. 개선 방법을 단계별로 제공하기
3. 교사가 어떤 방식으로 지도하면 좋을지 조언하기
필요한 경우 수학 수식은 LaTeX 형식으로 작성해줘. 예: \[ x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} \]
`;

// ✅ 개발자용 프롬프트 설정 DOM 요소
const gptPromptInput = document.getElementById('gptPromptInput');
const feedbackPromptInput = document.getElementById('feedbackPromptInput');
const setGptPromptBtn = document.getElementById('setGptPromptBtn');
const setFeedbackPromptBtn = document.getElementById('setFeedbackPromptBtn');


// ✅ placeholder로 초기 프롬프트 값 보여주기
gptPromptInput.placeholder = gptSystemPrompt;
feedbackPromptInput.placeholder = feedbackSystemPrompt;

// ✅ GPT 프롬프트 설정 버튼
setGptPromptBtn.addEventListener('click', () => {
  const newPrompt = gptPromptInput.value.trim();
  if (newPrompt) {
    gptSystemPrompt = newPrompt;
    document.querySelector('#gptPromptInput').parentElement.style.display = 'none';
    console.log("✅ GPT 프롬프트 설정 완료:", gptSystemPrompt);
  }
});

// ✅ 피드백 프롬프트 설정 버튼
setFeedbackPromptBtn.addEventListener('click', () => {
  const newPrompt = feedbackPromptInput.value.trim();
  if (newPrompt) {
    feedbackSystemPrompt = newPrompt;
    document.querySelector('#feedbackPromptInput').parentElement.style.display = 'none';
    console.log("✅ 피드백 프롬프트 설정 완료:", feedbackSystemPrompt);
  }
});