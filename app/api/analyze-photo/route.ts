import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { photoUrl } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    if (!photoUrl) {
      return NextResponse.json(
        { error: '사진 URL이 필요합니다.' },
        { status: 400 }
      );
    }

    // Vision API를 사용하여 사진 분석
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Vision 지원 모델
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `이 사진을 자세히 분석해주세요. 사진에 무엇이 있는지, 강아지나 고양이의 모습, 행동, 표정, 주변 환경 등을 자세히 설명해주세요. 
이 정보는 반려동물과의 추억을 되살리는 대화에서 사용될 예정이므로, 감정적이고 따뜻한 톤으로 작성해주세요.
한국어로 답변해주세요.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: photoUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const analysis = response.choices[0]?.message?.content || '사진을 분석할 수 없습니다.';

    return NextResponse.json({ analysis });
  } catch (error: any) {
    console.error('사진 분석 오류:', error);
    return NextResponse.json(
      { error: error.message || '사진 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

