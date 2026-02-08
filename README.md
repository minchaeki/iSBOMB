# 🛡️ iSBOMB: 블록체인 기반 AIBOM 무결성 거버넌스 프레임워크

> AI 공급망의 투명성 확보와 규제 준수 자동화를 위한 블록체인 기반 거버넌스 프레임워크
<img width="400" height="400" alt="iSBOMB" src="https://github.com/user-attachments/assets/5e79325f-611e-442c-ae57-a39d09bf6413" />


이 프로젝트는 AI 시스템의 보안 관리 핵심 요소인 AIBOM(AI Bill of Materials)의 데이터 무결성을 보장하고, 복잡한 규제 승인 절차를 블록체인과 DID(분산 식별자) 기술을 통해 혁신적으로 개선하는 것을 목표로 합니다.

---

## 👨‍💻 팀원 소개

| <img src="https://github.com/minchaeki.png" width="200" height="200"/> | <img src="https://github.com/sheunn.png" width="200" height="200"/> |
| :---: | :---: |
| **김민채** <br/> [@minchaeki](https://github.com/minchaeki) | **김시은** <br/> [@sheunn](https://github.com/sheunn) |
| **Full-stack & Blockchain Developer** | **AI Developer** |
| DID 인증, 프론트엔드, IPFS 구축, 블록체인 설계, UI/UX 디자인 | AI 챗봇 및 자동화 모듈 전반적 개발 |

---

## 📑 목차
1. [프로젝트 개요](#-프로젝트-개요)
2. [핵심 문제 해결 전략](#-핵심-문제-해결-전략)
3. [시스템 아키텍처](#-시스템-아키텍처)
4. [주요 기능 구현 상세](#-주요-기능-구현-상세)
5. [블록체인 스마트 컨트랙트 개요](#-블록체인-스마트-컨트랙트-개요)
6. [설치 및 실행](#-설치-및-실행)
7. [사용 방법](#-사용-방법)
8. [API 문서](#-api-문서)
9. [코드 컨벤션](#-코드-컨벤션)
10. [문제 해결](#-문제-해결)
11. [프로젝트 구조](#-프로젝트-구조)
12. [시현](#-시현)
13. [기술 스택](#-기술-스택)
14. [기대 효과 및 향후 계획](#-기대-효과-및-향후-계획)
15. [기여 가이드라인](#-기여-가이드라인)

---

## 💡 프로젝트 개요
최근 생성형 AI의 급격한 확산으로 AI 시스템의 안전성, 신뢰성, 투명성에 대한 요구가 높아지고 있습니다. 특히 의료 AI와 같은 고위험 분야는 엄격한 규제 승인이 필수적이지만, 수동으로 이루어지는 현재의 프로세스는 과도한 시간과 비용이 소요됩니다. 본 프로젝트는 이를 해결하기 위해 iSBOMB(Integrity-assured SBOM using Blockchain) 프레임워크를 제안합니다.

## 🎯 핵심 문제 해결 전략
*   **AIBOM 데이터 무결성**: 중앙 집중식 저장소의 위변조 위험을 방지하기 위해 블록체인의 불변성을 활용합니다.
*   **신원 인증 체계**: 중앙 서버 없는 자율적인 신원 관리를 위해 W3C 표준인 DID(Decentralized Identifier)를 통합합니다.
*   **대용량 데이터 처리**: 블록체인의 가스비 효율성을 위해 원본 데이터는 **IPFS**에 저장하고, 무결성 증명값(CID)만 온체인에 기록합니다.
*   **사후 시장 감시**: 제품 출시 후에도 보안 취약점을 지속적으로 추적하고 기록할 수 있는 체계를 제공합니다.

## 🏗 시스템 아키텍처
iSBOMB 프레임워크는 논리적으로 분리된 3개 계층으로 구성됩니다.

### 1. Application & Authentication Layer
*   **Frontend Dashboard**: React/Next.js 기반으로 개발자, 규제자, 감독자에게 역할별 기능을 제공합니다.
*   **DID Auth**: Hyperledger Indy/Aries 프레임워크를 사용하여 사용자 인증 및 전자 서명을 수행합니다.

### 2. Data Processing & Storage Layer
*   **IPFS Distributed Storage**: 대용량 AIBOM 및 규제 서류를 분산 저장하고 고유한 CID를 생성합니다.
*   **LLM Module**: (※ 협업 파트너 구현 파트)

### 3. Blockchain Layer (On-Chain)
*   **Ethereum Smart Contracts**: Polygon 네트워크상에서 AIBOM 레지스트리, 승인 결과, 보안 취약점 리포트를 관리합니다.
*   **Single Source of Truth**: 모든 이해관계자가 검증 가능한 투명한 이력 관리 기반을 제공합니다.

---

## 📄 블록체인 스마트 컨트랙트 개요

`AIBOMRegistry.sol`은 **AIBOM(AI Bill of Materials)** 및 관련 규제 문서를  
**온체인에서 투명하고 신뢰성 있게 관리**하기 위한 핵심 스마트 컨트랙트입니다.

본 컨트랙트는 AI 시스템의 구성 요소와 규제 대응 문서를 블록체인에 기록함으로써,  
AI 개발자, 감독자, 규제 기관 간의 **책임 분리된 상호작용**과  
**감사 가능성(Auditability)** 을 보장하는 것을 목표로 합니다.

---

## 🔑 주요 기능

### 1️⃣ AIBOM 등록
- 개발자는 새로운 AIBOM을 온체인에 등록할 수 있습니다.
- 등록 시 고유한 `modelId`가 자동으로 할당됩니다.
- 다음 정보가 블록체인에 저장됩니다.
  - AIBOM 소유자 주소
  - IPFS CID (Content Identifier)
  - 등록 시각
  - 검토 상태
  - 검토 사유



### 2️⃣ 규제 문서 제출
- 등록된 AIBOM에 대해 규제 기관 제출용 문서를 등록할 수 있습니다.
- 각 문서는 다음 정보를 포함합니다.
  - IPFS CID
  - 제출 시각
  - 문서 설명



### 3️⃣ 검토 상태 관리
- 컨트랙트 소유자는 AIBOM의 검토 상태를 관리할 수 있습니다.
- 지원되는 검토 상태는 다음과 같습니다.
  - `DRAFT`
  - `SUBMITTED`
  - `IN_REVIEW`
  - `APPROVED`
  - `REJECTED`



### 4️⃣ 감독자(Supervisor) 관리
- 컨트랙트 소유자는 감독자 계정을 추가하거나 제거할 수 있습니다.
- 감독자는 제한된 관리 권한을 부여받아 특정 기능을 수행할 수 있습니다.



### 5️⃣ 취약점(Vulnerability) 보고
- 권한 있는 주체(소유자)는 특정 AIBOM과 관련된 보안 취약점을 보고할 수 있습니다.
- 취약점 정보에는 다음이 포함됩니다.
  - IPFS CID
  - 심각도(severity)
  - 등록 시각
  - 활성 여부(active)



### 6️⃣ 자문(Advisory) 기록
- 감독자 또는 소유자는 AIBOM과 관련된 자문 기록을 등록할 수 있습니다.
- 자문에는 다음 정보가 포함됩니다.
  - IPFS CID
  - 적용 범위(scope)
  - 권고 조치(action)
  - 등록 시각
  - 보고자(reporter)



### 7️⃣ 접근 제어
- OpenZeppelin의 `Ownable` 컨트랙트를 상속하여 접근 제어를 구현합니다.
- 기능별 권한을 분리하여 무단 접근 및 오남용을 방지합니다.



## 🧱 핵심 데이터 구조

| 구조체 | 설명 |
|------|------|
| `AIBOM` | AIBOM 기본 정보 (소유자, IPFS CID, 타임스탬프, 검토 상태, 검토 사유) |
| `RegulatoryDossier` | 규제 기관 제출 문서 정보 |
| `Vulnerability` | 보안 취약점 정보 |
| `Advisory` | 자문 및 권고 이력 |



## ⚙️ 컨트랙트 구성 요소

### 🔹 상속 구조
- OpenZeppelin `Ownable` 컨트랙트 상속
- 컨트랙트 소유자(owner) 개념 도입
- 주요 관리 기능은 `onlyOwner` 모디파이어로 제한



### 🔹 열거형 (`enum`)

```solidity
enum ReviewStatus {
    DRAFT,
    SUBMITTED,
    IN_REVIEW,
    APPROVED,
    REJECTED
}
```
AIBOM의 검토 단계를 명확히 정의하여 상태 관리를 체계화합니다.



## 🧱 구조체 (Structs)

`AIBOMRegistry` 컨트랙트는 AIBOM 및 규제·보안 관련 정보를 명확히 분리된 구조체로 관리합니다.

### 🔹 AIBOM
AI 모델의 핵심 메타데이터를 저장하는 구조체입니다.

- `owner` : AIBOM 소유자 주소
- `cid` : AIBOM 문서의 IPFS CID
- `timestamp` : 등록 시각
- `status` : 검토 상태 (`ReviewStatus`)
- `reviewReason` : 승인 또는 반려 사유



### 🔹 RegulatoryDossier
규제 기관 제출 문서 정보를 저장합니다.

- `cid` : 규제 문서 IPFS CID
- `timestamp` : 제출 시각
- `description` : 문서 설명



### 🔹 Vulnerability
AIBOM과 연관된 보안 취약점 정보를 기록합니다.

- `cid` : 취약점 상세 정보 IPFS CID
- `timestamp` : 보고 시각
- `severity` : 취약점 심각도
- `active` : 활성 여부



### 🔹 Advisory
감독자 또는 소유자가 등록하는 자문(권고) 정보입니다.

- `cid` : 자문 문서 IPFS CID
- `scope` : 적용 범위
- `action` : 권장 조치
- `timestamp` : 기록 시각
- `reporter` : 보고자 주소



## ⚙️ 컨트랙트 구성 요소

### 🔹 상속 구조
- OpenZeppelin의 `Ownable` 컨트랙트를 상속
- 컨트랙트 소유자(owner) 개념 도입
- 핵심 관리 기능은 소유자만 실행 가능



### 🔹 열거형 (`enum`)

```solidity
enum ReviewStatus {
    DRAFT,
    SUBMITTED,
    IN_REVIEW,
    APPROVED,
    REJECTED
}
```
AIBOM의 전체 검토 생명주기를 명확하게 정의하여 상태 기반 로직 처리를 단순화합니다.

---

## 🛠 주요 기능 구현 상세

### ✅ DID 기반 신원 인증
*   Hyperledger Aries를 통해 생성된 QR 코드를 스캔하여 보안 연결을 생성합니다.
*   중앙 집중식 ID 제공자 없이 역할 기반 접근 제어(RBAC)를 수행합니다.

### ✅ AIBOM 등록 및 온체인 앵커링
*   AIBOM 업로드 시 IPFS에서 파일의 지문인 CID(Content Identifier)를 추출합니다.
*   추출된 CID와 모델 메타데이터를 스마트 컨트랙트에 기록하여 영구적인 증거를 남깁니다.

### ✅ 사후 시장 감시 및 취약점 보고
*   감독자(Supervisor)는 시장에 출시된 모델의 취약점을 분석하여 온체인 리포트를 제출합니다.
*   리포트 내역과 트랜잭션 해시를 통해 보안 조치 과정을 투명하게 공개합니다.


---

## ⚙️ 설치 및 실행 (Installation and Setup)

로컬 개발 환경에서 전체 애플리케이션을 실행하기 위한 단계별 지침입니다.

### 1. 저장소 복제 (Clone the Repository)

```bash
git clone https://github.com/your-username/iSBOMB.git
cd iSBOMB
```

### 2. 필수 구성 요소 (Prerequisites)

시작하기 전에 다음 도구들이 설치되어 있는지 확인하세요:

*   [Docker](https://www.docker.com/get-started) 및 Docker Compose
*   [Node.js](https://nodejs.org/en/) (v18 이상 권장)
*   [Yarn](https://yarnpkg.com/getting-started/install)
*   [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

### 3. 백엔드 서비스 실행 (Run Backend Services)

VON 네트워크, 세 가지 ACA-Py 에이전트, FastAPI 백엔드를 포함한 핵심 백엔드 인프라는 Docker Compose로 관리됩니다.

```bash
docker-compose up -d
```

이 명령어는 모든 서비스를 백그라운드 모드(`-d`)로 빌드하고 시작합니다. 각 서비스의 로그는 `docker-compose logs -f <service_name>` 명령어를 사용하여 확인할 수 있습니다.

### 4. 블록체인 설정 (Set Up the Blockchain)

블록체인 구성 요소는 Hardhat 프로젝트입니다. 로컬 노드를 시작하고 스마트 계약을 배포해야 합니다.

```bash
# 블록체인 디렉토리로 이동
cd blockchain

# 의존성 설치
npm install

# 로컬 Hardhat 노드 시작
npx hardhat node
```

새로운 터미널에서 `AIBOMRegistry` 스마트 계약을 배포합니다:

```bash
# 블록체인 디렉토리에 있는지 확인
cd blockchain

# 로컬 노드에 계약 배포
npx hardhat run scripts/deploy.ts --network localhost
```

Hardhat 노드 터미널을 계속 실행 상태로 유지하세요.

### 5. 프론트엔드 애플리케이션 실행 (Run the Frontend Application)

프론트엔드는 Next.js 애플리케이션이며, Yarn을 사용하여 패키지를 관리합니다.

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
yarn install

# 개발 서버 실행
yarn dev
```

---

## 🚀 사용 방법 (Usage)

위의 모든 단계를 완료하면:

*   **프론트엔드 애플리케이션**은 [http://localhost:3000](http://localhost:3000) 에서 접근할 수 있습니다.
*   **백엔드 API** (FastAPI)는 [http://localhost:8000](http://localhost:8000) 에서 실행됩니다.
*   **VON 네트워크 원장 브라우저**는 [http://localhost:9700](http://localhost:9700) 에서 확인할 수 있습니다.
*   로컬 **Hardhat EVM**은 `http://127.0.0.1:8545/` 에서 실행 중입니다.

이제 프론트엔드를 통해 애플리케이션과 상호작용할 수 있습니다. 웹 인터페이스의 사용자 흐름을 따라 다양한 사용자 역할(개발자, 규제자, 감독자)을 탐색할 수 있습니다.

---

## 📝 API 문서 (API Documentation)

*   **백엔드 API (FastAPI):**
    *   FastAPI 기반 백엔드는 자동 생성된 OpenAPI (Swagger UI) 문서를 제공합니다.
    *   애플리케이션이 실행 중인 경우, 다음 URL에서 API 문서를 확인할 수 있습니다:
        *   Swagger UI: `http://localhost:8000/docs`
        *   ReDoc: `http://localhost:8000/redoc`

*   **ACA-Py 에이전트 Admin API:**
    *   ACA-Py 에이전트의 Admin API는 각 에이전트의 관리 포트(예: 개발자 에이전트 `9081`, 규제자 에이전트 `9181`, 감독자 에이전트 `9281`)를 통해 접근할 수 있습니다.
    *   예를 들어, 개발자 에이전트의 Admin API 문서는 `http://localhost:9081/swagger`에서 확인할 수 있습니다.

---

## ✒️ 코드 컨벤션 (Code Convention)

본 프로젝트는 각 언어 및 프레임워크의 표준 코드 컨벤션을 따르며, 일관된 코드 품질을 유지하는 것을 목표로 합니다.

*   **Python (Backend):**
    *   PEP 8 가이드라인을 따릅니다.
    *   `ruff`와 `black`을 사용하여 코드 포매팅을 강제합니다. (설치: `pip install ruff black`)
    *   코드 포매팅: `black .`
    *   린트 검사: `ruff check .`

*   **TypeScript/JavaScript (Frontend, Blockchain):**
    *   ESLint 및 Prettier를 사용하여 코드 스타일을 관리합니다. (설치: `yarn add --dev eslint prettier` 또는 `npm install --save-dev eslint prettier`)
    *   코드 포매팅: `prettier --write .`
    *   린트 검사: `eslint .`

*   **Solidity (Blockchain):**
    *   Solidity Style Guide를 따릅니다.
    *   Hardhat 환경에서는 `solhint` 등을 활용할 수 있습니다.

Pull Request를 제출하기 전에 해당 컨벤션에 맞게 코드를 포매팅하고 린트 검사를 실행해주세요.

---

## 🐛 문제 해결 (Troubleshooting)

프로젝트를 실행하거나 사용하는 동안 발생할 수 있는 일반적인 문제와 해결책입니다.

*   **Docker Compose 서비스가 시작되지 않음:**
    *   `docker-compose logs` 명령어를 사용하여 특정 서비스의 로그를 확인하고 오류 메시지를 분석합니다.
    *   다른 애플리케이션이 동일한 포트(예: `8000`, `9080`, `9700`)를 사용하고 있지 않은지 확인하고, 필요하다면 해당 애플리케이션을 종료하거나 포트 설정을 변경하세요.
    *   `docker-compose down --volumes` 명령어로 컨테이너와 볼륨을 모두 제거한 후 다시 `docker-compose up -d`를 시도해 볼 수 있습니다.

*   **Hardhat 노드 연결 문제:**
    *   프론트엔드 또는 배포 스크립트에서 Hardhat 노드의 URL(`http://127.0.0.1:8545/`)이 올바르게 구성되어 있는지 확인하세요.
    *   Hardhat 노드가 별도의 터미널에서 실행 중인지 확인하는 것이 중요합니다. 백그라운드에서 실행되지 않고 포그라운드에서 로그를 출력하며 실행되어야 합니다.

*   **DID 연결 문제:**
    *   ACA-Py 에이전트 간의 연결 또는 백엔드와 에이전트 간의 웹훅 연결에 문제가 있을 수 있습니다.
    *   `docker-compose logs <agent_service_name>` (예: `docker-compose logs developer-agent`) 명령어를 통해 해당 에이전트의 로그를 확인하여 연결 오류를 찾으세요.

*   **프론트엔드 빌드 또는 실행 실패:**
    *   `frontend` 디렉토리 내에서 `yarn install`이 제대로 완료되었는지 확인하세요.
    *   의존성 문제가 해결되지 않으면 `node_modules` 폴더와 `yarn.lock` 파일을 삭제한 후 `yarn install`을 다시 시도해보세요.
    *   `yarn dev` 또는 `yarn build` 명령을 다시 실행하여 오류 메시지를 확인하세요.

---

## 📂 프로젝트 구조 (Project Structure)

```
.
├── acapy/            # ACA-Py 에이전트 구성 및 Dockerfile
├── backend/          # FastAPI 백엔드 애플리케이션 소스 코드
├── blockchain/       # 스마트 계약, 테스트, 배포 스크립트가 포함된 Hardhat 프로젝트
├── frontend/         # Next.js 프론트엔드 애플리케이션
├── von-network/      # 로컬 Indy 원장인 VON 네트워크
└── docker-compose.yml # 백엔드 서비스를 위한 메인 Docker Compose 파일
```

---

## 🎥 시현 
## 1.로그인 화면

<img width="1467" height="807" alt="스크린샷 2026-02-09 오전 1 45 07" src="https://github.com/user-attachments/assets/b39078d7-8c61-462b-91fa-b2bfe9788594" />

사용자는 역할(Developer, Regulator, Supervisor)에 따라 로그인할 수 있으며, 역할에 따라 접근 가능한 기능과 대시보드가 분리됩니다.

## 2.문서 생성 ChatBot

<img width="513" height="671" alt="스크린샷 2026-02-09 오전 1 47 53" src="https://github.com/user-attachments/assets/c3c2e34c-f0b9-4e70-b176-1aea970153ff" />

LLM 기반 챗봇을 통해 AIBOM 문서 및 관련 보안 문서를 자동 생성할 수 있습니다. 사용자는 자연어 입력만으로 표준화된 문서를 생성할 수 있습니다.

## 3. AIBOM 및 문서 등록 (IPFS + Blockchain)

<img width="619" height="106" alt="스크린샷 2026-02-09 오전 1 53 34" src="https://github.com/user-attachments/assets/bf00b52b-237b-4bed-8e82-619de88d6cd5" />

생성된 AIBOM 및 문서를 IPFS에 업로드하고,반환된 CID(Content Identifier)를 블록체인에 등록합니다.

<img width="731" height="89" alt="스크린샷 2026-02-09 오전 1 52 02" src="https://github.com/user-attachments/assets/ace77bc2-5a30-435d-a5a1-4d2ca98f3e30" />

등록이 완료되면 다음과 같은 알림이 표시됩니다.

## 4. CID 검증 실패 화면

<img width="1011" height="238" alt="스크린샷 2026-02-09 오전 1 55 22" src="https://github.com/user-attachments/assets/1ecfa690-7088-48a4-aaee-619de88d6cd5" />

입력된 CID가 블록체인에 등록된 값과 일치하지 않을 경우,검증 실패 메시지가 사용자에게 표시됩니다.

## 5. 취약점 보고 및 알림

<img width="1002" height="621" alt="스크린샷 2026-02-09 오전 1 56 47" src="https://github.com/user-attachments/assets/0e104953-cbf7-4cbb-907e-90dc06586af3" />

보안 취약점이 보고되면,해당 취약점의 영향을 받는 당사자에게 대시보드 알림으로 표시됩니다.

<img width="980" height="81" alt="스크린샷 2026-02-09 오전 1 56 31" src="https://github.com/user-attachments/assets/a355c8d2-a659-4841-9cd2-674eb58c6ec3" />



---

## 🛠️ 기술 스택
| Category | Stack |
| :--- | :--- |
| **Blockchain** | ![Solidity](https://img.shields.io/badge/Solidity-363636?style=flat-square&logo=solidity&logoColor=white) ![Polygon](https://img.shields.io/badge/Polygon-8247E5?style=flat-square&logo=polygon&logoColor=white) ![Hardhat](https://img.shields.io/badge/Hardhat-FFF100?style=flat-square&logo=hardhat&logoColor=black) |
| **Identity & Storage** | ![Hyperledger](https://img.shields.io/badge/Hyperledger_Indy/Aries-2F3134?style=flat-square&logo=hyperledger&logoColor=white) ![IPFS](https://img.shields.io/badge/IPFS-65C2CB?style=flat-square&logo=ipfs&logoColor=white) |
| **Languages** | ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) ![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white) ![Solidity](https://img.shields.io/badge/Solidity-363636?style=flat-square&logo=solidity&logoColor=white) |
| **Client** | ![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black) ![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) |
| **Backend** | ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white) |
| **Dev Tools** | ![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white) ![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) |

## 🚀 기대 효과 및 향후 계획
*   **신뢰성 및 효율성**: 신뢰 기반 문서 자동화를 통해 컴플라이언스 비용과 시간을 대폭 절감합니다.
*   **투명한 이력 관리**: AI 모델의 생애주기 전반에 걸친 책임 소재를 명확히 합니다.
*   **향후 계획**: 영지식 증명(ZKP) 도입을 통한 데이터 프라이버시 강화 및 SPDX/CycloneDX 등 국제 표준과의 호환성 확보를 목표로 합니다.

---
