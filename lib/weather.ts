// 날씨 기반 메시지 생성

interface WeatherInfo {
  condition: 'rain' | 'snow' | 'sunny' | 'cloudy' | 'windy';
  temperature?: number;
}

interface PetInfo {
  name: string;
  userNickname: string;
  personalityType: 'sweet' | 'cool' | 'mature' | 'shy';
  dislikedThing?: string;
}

// 날씨 조건 판단 (간단한 버전 - 실제로는 날씨 API 사용)
export function getWeatherCondition(): WeatherInfo {
  // 실제 구현 시에는 날씨 API를 호출하거나
  // 사용자 위치를 기반으로 날씨를 가져옵니다
  // 지금은 랜덤하게 반환 (데모용)
  const conditions: WeatherInfo['condition'][] = ['rain', 'snow', 'sunny', 'cloudy', 'windy'];
  return {
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    temperature: Math.floor(Math.random() * 30) + 5, // 5-35도
  };
}

// 날씨 기반 메시지 생성
export function generateWeatherMessage(petInfo: PetInfo, weather: WeatherInfo): string {
  const messages = {
    rain: {
      sweet: `${petInfo.userNickname}! 비 온다! 천둥 쳐도 나 안 무서워, ${petInfo.userNickname}이(가) 지켜주니까! 우산 꼭 챙기고 나가! 사랑해! 💕`,
      cool: `${petInfo.userNickname}, 비 온다. 우산 챙겨.`,
      mature: `${petInfo.userNickname}, 비가 오고 있네요. 우산을 챙기시는 게 좋겠습니다.`,
      shy: `${petInfo.userNickname}... 비 온다... 우산 챙기고 나가야 해...`,
    },
    snow: {
      sweet: `${petInfo.userNickname}! 눈 내린다! 우리 같이 눈사람 만들고 싶었는데... 여기서는 눈이 안 와서 아쉬워. ${petInfo.userNickname} 대신 만들어줘! 사랑해! 💕`,
      cool: `${petInfo.userNickname}, 눈 온다. 미끄러우니까 조심해.`,
      mature: `${petInfo.userNickname}, 눈이 내리고 있습니다. 미끄러우니 조심하세요.`,
      shy: `${petInfo.userNickname}... 눈 내린다... 미끄러우니까 조심해야 해...`,
    },
    sunny: {
      sweet: `${petInfo.userNickname}! 날씨가 정말 좋다! 우리 같이 산책하고 싶었는데... ${petInfo.userNickname} 혼자라도 산책 나가! 사랑해! 💕`,
      cool: `${petInfo.userNickname}, 날씨 좋다. 산책 나가면 좋을 것 같은데.`,
      mature: `${petInfo.userNickname}, 날씨가 좋네요. 산책 나가시면 좋을 것 같습니다.`,
      shy: `${petInfo.userNickname}... 날씨 좋다... 산책 나가면 좋을 것 같아...`,
    },
    cloudy: {
      sweet: `${petInfo.userNickname}! 날씨가 좀 흐리네. 그래도 ${petInfo.userNickname} 마음은 맑으면 돼! 사랑해! 💕`,
      cool: `${petInfo.userNickname}, 날씨 흐리네.`,
      mature: `${petInfo.userNickname}, 날씨가 흐리네요.`,
      shy: `${petInfo.userNickname}... 날씨 흐리다...`,
    },
    windy: {
      sweet: `${petInfo.userNickname}! 바람 많이 분다! 옷 따뜻하게 입고 나가! 나는 여기서 ${petInfo.userNickname} 생각하면서 바람 맞고 있을게! 사랑해! 💕`,
      cool: `${petInfo.userNickname}, 바람 많이 분다. 옷 따뜻하게 입어.`,
      mature: `${petInfo.userNickname}, 바람이 많이 부네요. 옷을 따뜻하게 입으세요.`,
      shy: `${petInfo.userNickname}... 바람 많이 분다... 옷 따뜻하게 입어야 해...`,
    },
  };

  return messages[weather.condition][petInfo.personalityType] || messages[weather.condition].sweet;
}

// 실제 날씨 API 호출 (OpenWeatherMap 사용 예시)
export async function fetchWeatherData(lat?: number, lon?: number): Promise<WeatherInfo> {
  // 실제 구현 시에는 사용자 위치를 기반으로 날씨 API를 호출합니다
  // 예: OpenWeatherMap API
  // const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  // const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr`;
  // const response = await fetch(url);
  // const data = await response.json();
  // 
  // 날씨 조건 매핑
  // const weatherMain = data.weather[0].main.toLowerCase();
  // if (weatherMain.includes('rain')) return { condition: 'rain', temperature: data.main.temp };
  // if (weatherMain.includes('snow')) return { condition: 'snow', temperature: data.main.temp };
  // ...
  
  // 지금은 랜덤 반환 (데모용)
  return getWeatherCondition();
}

