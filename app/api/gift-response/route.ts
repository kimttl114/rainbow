import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateSystemPrompt } from '@/lib/prompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const giftNames: { [key: string]: string } = {
  'sweet-potato': '고구마',
  'treat': '개껌',
  'toy': '장난감',
  'flower': '꽃',
  'heart': '하트',
};

export async function POST(request: NextRequest) {
  try {
    const { petInfo, giftType } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    if (!petInfo || !giftType) {
      return NextResponse.json(
        { error: '펫 정보와 선물 종류가 필요합니다.' },
        { status: 400 }
      );
    }

    const systemPrompt = generateSystemPrompt(petInfo);
    const giftName = giftNames[giftType] || '선물';
    
    const giftPrompt = `${petInfo.userNickname}이(가) ${giftName}을(를) 보내줬어요!

${petInfo.name}의 관점에서 이 선물에 대해 자연스럽게 반응해주세요. 예를 들어:
- 고구마를 좋아했던 추억을 언급
- 선물에 감사 표현
- ${petInfo.userNickname}을(를) 그리워하는 감정 표현

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
          content: giftPrompt,
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
    console.error('선물 응답 생성 오류:', error);
    return NextResponse.json(
      { error: error.message || '선물 응답 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

