import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateSystemPrompt } from '@/lib/prompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { petInfo, dreamText } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    if (!petInfo || !dreamText) {
      return NextResponse.json(
        { error: '펫 정보와 꿈 내용이 필요합니다.' },
        { status: 400 }
      );
    }

    const systemPrompt = generateSystemPrompt(petInfo);
    
    const dreamPrompt = `${petInfo.userNickname}이(가) 꿈에 나온 이야기를 들려주고 있어요:

"${dreamText}"

${petInfo.name}의 관점에서 이 꿈에 대해 자연스럽게 반응해주세요. 예를 들어:
- "나도 그 꿈에 나왔어! 기억나?"
- "그 꿈에서 우리 같이 놀았지? 정말 좋았어!"
- "꿈에서도 ${petInfo.userNickname}을(를) 만나서 기뻤어"

${petInfo.name}의 성격과 말투를 유지하면서, 따뜻하고 감성적으로 응답해주세요. 짧고 간결하게 (1-3문장) 작성해주세요.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: dreamPrompt,
        },
      ],
      temperature: 0.9,
      max_tokens: 200,
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
    });

    const response = completion.choices[0]?.message?.content || '응답을 생성할 수 없습니다.';

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('꿈 응답 생성 오류:', error);
    return NextResponse.json(
      { error: error.message || '꿈 응답 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

