import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateSystemPrompt } from '@/lib/prompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { petInfo, weather } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    if (!petInfo || !weather) {
      return NextResponse.json(
        { error: '펫 정보와 날씨 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    const systemPrompt = generateSystemPrompt(petInfo);
    
    // 날씨 기반 메시지 생성 프롬프트
    const weatherMessages = {
      rain: '비가 오고 있습니다',
      snow: '눈이 내리고 있습니다',
      sunny: '날씨가 맑고 화창합니다',
      cloudy: '날씨가 흐립니다',
      windy: '바람이 많이 붑니다',
    };

    const weatherPrompt = `현재 날씨: ${weatherMessages[weather.condition as keyof typeof weatherMessages] || '날씨가 좋습니다'}
${weather.temperature ? `온도: ${weather.temperature}도` : ''}

${petInfo.userNickname}에게 날씨에 대해 자연스럽게 말을 걸어주세요. ${petInfo.name}의 성격과 말투를 유지하면서, 날씨에 맞는 따뜻한 메시지를 전달해주세요.
- 비 오는 날: 우산을 챙기라고 걱정하거나, 천둥을 무서워했던 과거 추억을 언급
- 눈 오는 날: 함께 눈사람을 만들고 싶었던 추억을 언급
- 맑은 날: 산책하고 싶었던 추억을 언급
- 흐린 날: 마음만은 맑게 지내라는 격려
- 바람 부는 날: 옷을 따뜻하게 입으라고 걱정

짧고 간결하게 (1-3문장), 자연스럽고 따뜻하게 작성해주세요.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: weatherPrompt,
        },
      ],
      temperature: 0.9,
      max_tokens: 150,
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
    });

    const message = completion.choices[0]?.message?.content || '날씨 메시지를 생성할 수 없습니다.';

    return NextResponse.json({ message });
  } catch (error: any) {
    console.error('날씨 메시지 생성 오류:', error);
    return NextResponse.json(
      { error: error.message || '날씨 메시지 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

