import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateSystemPrompt } from '@/lib/prompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 무지개 편지 생성
export async function POST(request: NextRequest) {
  try {
    const { petInfo, todayMessages } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    if (!petInfo) {
      return NextResponse.json(
        { error: '펫 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    const systemPrompt = generateSystemPrompt(petInfo);

    // 오늘의 대화 요약 및 편지 생성
    const letterPrompt = `오늘 ${petInfo.userNickname}과 나눈 대화를 바탕으로, 따뜻하고 위로가 되는 편지를 작성해주세요. 
강아지 말투로, 시처럼 아름답고 감동적으로 작성해주세요. 
오늘의 대화 내용: ${todayMessages.map((m: any) => m.text).join('\n')}

편지는 다음과 같은 형식으로 작성해주세요:
- 인사말
- 오늘의 대화에 대한 감상
- 위로와 격려
- 마무리 인사`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: letterPrompt,
        },
      ],
      temperature: 0.9,
      max_tokens: 500,
    });

    const letter = completion.choices[0]?.message?.content || '편지를 생성할 수 없습니다.';

    return NextResponse.json({ letter });
  } catch (error: any) {
    console.error('편지 생성 오류:', error);
    return NextResponse.json(
      { error: error.message || '편지 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

