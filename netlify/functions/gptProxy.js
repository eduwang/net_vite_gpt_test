import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // 환경변수에서 키 읽기
});

export async function handler(event) {
  const body = JSON.parse(event.body);
  const model = body.model || 'gpt-4-turbo';

  console.log("✅ 모델:", model);
  console.log("✅ 메시지 수:", body.messages?.length);
  console.log("✅ 메시지 내용:", JSON.stringify(body.messages, null, 2));

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: body.messages,
      temperature: body.temperature || 0.6,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.error("❌ GPT API 호출 에러:", err); // 여기에 찍히는 메시지가 핵심!
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message }),
    };
  }
}

