# 아이템 시뮬레이터

## 개요

이 프로젝트는 Node.js와 Express.js를 사용하여 풋살 웹 게임을 구현하는 과제입니다.
피파의 익스트림 열화판이군요.

## 기술 스택

- **Node.js**: 서버 사이드 자바스크립트 실행 환경
- **Express.js**: Node.js 웹 애플리케이션 프레임워크
- **MySQL**: 관계형 데이터베이스 (Prisma를 통해 사용)
- **JWT**: JSON Web Token을 사용한 인증
- **AWS EC2**: 배포 플랫폼

## 프로젝트 설치 및 실행

### 요구 사항

- Node.js
- npm
- MySQL

### 설치

1. **레포지토리 클론**

   ```bash
   git clone https://github.com/Ayumudayo/futsal-online.git
   cd futsal-online
   ```

2. **의존성 설치**

   ```bash
   npm install
   ```

3. **환경 변수 설정**

   `.env` 파일을 생성하고, 아래와 같은 환경 변수를 설정합니다.

   ```plaintext
   PORT=3000
   JWT_SECRET=your_jwt_secret
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASS=your_database_password
   DB_NAME=your_database_name
   ```

4. **서버 실행**

   ```bash
   npm start
   ```

## API 문서

### 인증 미들웨어

- **JWT 인증**: 모든 인증이 필요한 API는 `authorization` 헤더를 통해 Bearer 토큰을 사용합니다.

## 선수 강화 기능 구현에 대해

### 사고의 흐름
일단 본 프로젝트에서 강조할 부분은 **가챠와 강화를 통한 구단 가치 상승을 통한 재미**이다.
따라서 강화가 핵심 기능의 위치를 차지하게 되었다.

각 선수들의 데이터(능력치)는 미리 정의된 상태로 DB에 있다.
그리고 [UserPlayer 모델](https://github.com/Ayumudayo/futsal-online/blob/78009fcd086006fa32640fac27cbb036f72a6fd1/prisma/schema.prisma#L56)엔 능력치와 관련한 부분은 없고 강화 단계와 선수 가치에 관한 부분이 존재한다.
따라서 강화기능은 먼저 레벨과 선수 가치 수정을 우선하여 작성하기로 했다.

1. 선수 가져오기
- 선수가 실제로 존재하는지, 이미 최대치로 강화가 완료된 선수인지 확인한다.

2. 강화 비용 계산
- 기본값은 `1000`이다. `calculateEnhancementCost`를 통해 단계 별로 강화 비용을 30%씩 증가시킨다.

3. 유저의 보유 재화 확인
- 당연히 강화도 돈이 있어야 한다.

4. 성공 여부 판단
- `successRates`를 통해 미리 정의된 성공률 테이블을 활용한다.
- 각 단계 별로 이 값과 비교하여 성공/실패를 구분하게 된다.

5. 결과에 따라 DB 업데이트
- 성공 시 유저의 총 구단 가치와 선수 가치를 업데이트 한다.
- 2개의 쿼리가 일관성 있게 이루어져야 하므로 트랜잭션으로 묶어서 처리.
- 실패해도 당연히 돈은 감소한다.