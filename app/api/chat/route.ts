import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateSystemPrompt } from '@/lib/prompt';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, petInfo, currentPhotoUrl } = await request.json();

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

    // System Prompt 생성
    const systemPrompt = generateSystemPrompt(petInfo);

    // 최근 대화만 포함 (너무 많은 컨텍스트는 AI 느낌을 강화할 수 있음)
    const recentMessages = messages.slice(-10); // 최근 10개 메시지만

    // 메시지를 OpenAI 형식으로 변환
    const formattedMessages = recentMessages.map((msg: any) => {
      const baseMessage: any = {
        role: msg.sender === 'user' ? 'user' : 'assistant',
      };

      // 현재 메시지에 사진이 있으면 Vision API 사용
      if (msg.photoUrl && currentPhotoUrl && currentPhotoUrl === msg.photoUrl) {
        // 사진 분석을 위한 상세한 프롬프트
        const photoPrompt = msg.text && msg.text.trim() 
          ? `${petInfo.userNickname}이(가) 이 사진을 보내면서 "${msg.text}"라고 했어요. 이 사진을 자세히 보고 ${petInfo.name}의 관점에서 감정적이고 따뜻하게 반응해주세요. 사진에 무엇이 있는지 구체적으로 언급하며 (${petInfo.name}의 모습, 행동, 표정, 주변 환경 등) 추억을 나누는 것처럼 대답해주세요.`
          : `${petInfo.userNickname}이(가) 사진을 보냈어요. 이 사진을 자세히 보고 ${petInfo.name}의 관점에서 감정적이고 따뜻하게 반응해주세요. 사진에 무엇이 있는지 구체적으로 언급하며 (${petInfo.name}의 모습, 행동, 표정, 주변 환경 등) 추억을 나누는 것처럼 대답해주세요. 예를 들어 "누나, 우리 이때 기억나? 내가 ${petInfo.favoriteSnack} 먹고 있던 때야!" 같은 식으로 구체적으로 말해주세요.`;
        
        baseMessage.content = [
          {
            type: 'text',
            text: photoPrompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: msg.photoUrl,
            },
          },
        ];
      } else {
        baseMessage.content = msg.text;
      }

      return baseMessage;
    });

    // 사진이 있는지 확인
    const hasPhoto = currentPhotoUrl && formattedMessages.some((msg: any) => 
      Array.isArray(msg.content) && msg.content.some((item: any) => item.type === 'image_url')
    );

    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Vision API 지원 모델
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...formattedMessages,
      ],
      temperature: 0.9, // 더 높은 창의성
      max_tokens: hasPhoto ? 250 : 200, // 사진이 있으면 더 긴 응답 허용
      presence_penalty: 0.3, // 반복을 줄여서 더 자연스럽게
      frequency_penalty: 0.3, // 자주 나오는 단어를 줄여서 다양성 증가
    });

    const responseText = completion.choices[0]?.message?.content || '응답을 생성할 수 없습니다.';

    return NextResponse.json({ text: responseText });
  } catch (error: any) {
    console.error('OpenAI API 오류:', error);
    return NextResponse.json(
      { error: error.message || 'AI 응답 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

