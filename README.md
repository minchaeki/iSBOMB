# 🛡️ iSBOMB: 블록체인 기반 AIBOM 무결성 거버넌스 프레임워크

> AI 공급망의 투명성 확보와 규제 준수 자동화를 위한 블록체인 기반 거버넌스 프레임워크
<img width="400" height="400" alt="iSBOMB" src="https://github.com/user-attachments/assets/5e79325f-611e-442c-ae57-a39d09bf6413" />


이 프로젝트는 AI 시스템의 보안 관리 핵심 요소인 AIBOM(AI Bill of Materials)의 데이터 무결성을 보장하고, 복잡한 규제 승인 절차를 블록체인과 DID(분산 식별자) 기술을 통해 혁신적으로 개선하는 것을 목표로 합니다.

📌 단순 구현 프로젝트가 아닌 **기존 연구 논문 분석 → 시스템 아키텍처 설계 → 실제 구현 → 학회 논문 발표**까지 전 과정을 수행한 **연구·개발 통합 프로젝트**입니다.

---

## 👨‍💻 팀원 소개

| <img src="https://github.com/minchaeki.png" width="200" height="200"/> | <img src="https://github.com/sheunn.png" width="200" height="200"/> |
| :---: | :---: |
| **김민채** <br/> [@minchaeki](https://github.com/minchaeki) | **김시은** <br/> [@sheunn](https://github.com/sheunn) |
| **Full-stack & Blockchain Developer** | **AI Developer** |
| DID 인증, 프론트엔드, IPFS 구축, 블록체인 설계, UI/UX 디자인 | AI 챗봇 및 자동화 모듈 전반적 개발 |

---

## 📑 목차
1. [프로젝트 한눈에 보기](#-프로젝트-한눈에-보기)
2. [이 프로젝트에서 다룬 보안 개념](#-이-프로젝트에서-다룬-보안-개념)
3. [나의 담당 역할 상세](#-나의-담당-역할-상세)
4. [프로젝트 배경 — AI 공급망의 보안 위협](#-프로젝트-배경--ai-공급망의-보안-위협)
5. [시스템 아키텍처 — Security by Design](#-시스템-아키텍처--security-by-design)
6. [핵심 기능](#-핵심-기능)
7. [스마트 컨트랙트 보안 설계](#-스마트-컨트랙트-보안-설계--aibomregistrysol)
8. [시연](#-시현)
9. [트러블슈팅](#-트러블슈팅-troubleshooting)
10. [기술 스택](#️-기술-스택)
11. [설치 및 실행](#️-설치-및-실행)
12. [프로젝트 구조](#-프로젝트-구조)
13. [코드 컨벤션](#️-코드-컨벤션)
14. [향후 개선 계획](#-향후-개선-계획)
15. [기대 효과](#-기대-효과)
16. [논문 정보](#-논문-정보-publication)
    
---

# 📌 프로젝트 한눈에 보기

| 항목 | 내용 |
|------|------|
| **한 줄 요약** | AI 공급망의 보안 취약점을 해결하기 위해, AIBOM(AI Bill of Materials)의 무결성을 블록체인으로 보장하고 규제 승인 절차를 자동화하는 보안 거버넌스 프레임워크 |
| **핵심 보안 가치** | 데이터 무결성 보장 · 분산 신원 인증(DID) · 역할 기반 접근 제어(RBAC) · 취약점 추적 · 감사 추적성(Auditability) |
| **개발 기간** | 2025.09 ~ 2026.02 (약 6개월) |
| **팀 구성** | 2인 (AI 파트 1인 + **풀스택 & 보안 아키텍처 전체 1인**) |
| **나의 역할** | **보안 아키텍처 설계, 프론트엔드, 백엔드 API, 스마트 컨트랙트, DID 인증, IPFS, Docker 인프라, UI/UX** — AI를 제외한 전 영역 단독 개발 |
| **성과** | ICACT 2026 국제학회 논문 발표 |

---

## 🔐 이 프로젝트에서 다룬 보안 개념

이 프로젝트는 단순히 기능을 구현하는 것이 아니라, **"보안을 어떻게 설계에 녹여넣을 것인가"**라는 질문에서 출발했습니다. 아래는 프로젝트 전반에 걸쳐 직접 설계하고 구현한 보안 개념들입니다.

| 보안 원칙 | 적용 방식 | 구현 위치 |
|-----------|-----------|-----------|
| **데이터 무결성 (Integrity)** | 블록체인 온체인 앵커링 + IPFS CID 해시 검증으로 위변조 원천 차단 | Smart Contract, IPFS |
| **인증 (Authentication)** | W3C DID 표준 기반 분산 신원 인증, 중앙 서버 없는 자율적 신원 관리 | Hyperledger Indy/Aries |
| **인가 (Authorization)** | 역할 기반 접근 제어(RBAC) — Owner / Supervisor / Developer 권한 분리 | Smart Contract, Frontend |
| **부인 방지 (Non-repudiation)** | 모든 행위(등록·승인·보고)가 블록체인에 영구 기록, 트랜잭션 해시로 증명 | Blockchain Layer |
| **감사 추적성 (Auditability)** | AIBOM 생애주기 전체의 변경 이력을 투명하게 추적 가능 | Smart Contract, Dashboard |
| **가용성 (Availability)** | IPFS 분산 저장으로 단일 장애점(SPOF) 제거, Docker 기반 서비스 격리 | IPFS, Docker Compose |
| **최소 권한 원칙 (Least Privilege)** | `onlyOwner` modifier, Supervisor 매핑 등으로 기능별 최소 권한만 부여 | Smart Contract |
| **공급망 보안 (Supply Chain Security)** | AI 모델 구성요소 명세서(BOM) 기반 공급망 투명성 확보 및 취약점 추적 | 프레임워크 전체 |

---

## 🧑‍💻 나의 담당 역할 상세 

### 🔒 보안 아키텍처 설계
- CIA 삼요소(기밀성·무결성·가용성)를 기반으로 시스템 전체의 보안 요구사항을 분석하고 위협 모델링 수행
- "데이터가 어디서 생성되고, 누가 접근하며, 어떻게 변조를 탐지할 것인가"를 중심으로 3계층 아키텍처 설계
- 역할별 접근 제어 정책을 정의하고, 스마트 컨트랙트 레벨에서 온체인 권한 검증 로직 구현
- IPFS + 블록체인 이중 검증 구조를 설계하여 데이터 무결성과 가용성을 동시에 확보

### 🖥️ Frontend (React / Next.js / TailwindCSS)
- 역할 기반 대시보드 UI 3종(Developer · Regulator · Supervisor)을 직접 디자인하고 구현
- QR 코드 기반 DID 인증 플로우 — 사용자가 Verifiable Credential을 스캔하여 역할을 증명하는 보안 인증 UX 개발
- CID 무결성 검증 실패 시 경고 UI, 취약점 보고 시 실시간 대시보드 알림 등 **보안 이벤트에 대한 사용자 피드백 인터페이스** 설계
- Ethers.js를 통해 프론트엔드에서 직접 스마트 컨트랙트와 상호작용하는 Web3 연동 구현

### ⚙️ Backend (FastAPI / Python)
- RESTful API 서버 설계 및 구현: AIBOM 등록, 문서 제출, 검증 요청 등 비즈니스 로직 전담
- ACA-Py 에이전트 3개(Developer · Regulator · Supervisor)와의 **Webhook 기반 보안 통신 체계** 구축
- 에이전트별 Connection 수립, Credential 발급·검증 파이프라인 설계 — DID 기반 인증의 백엔드 처리 로직 구현
- Swagger UI / ReDoc 기반 API 문서 자동 생성

### ⛓️ Blockchain (Solidity / Hardhat / Polygon)
- `AIBOMRegistry.sol` 스마트 컨트랙트 전체 설계 및 구현
- AIBOM 등록, 규제 문서 제출, 검토 상태 관리, **취약점 보고**, **자문 기록** 등 5가지 핵심 온체인 기능 개발
- OpenZeppelin `Ownable` 기반 접근 제어 및 **역할별 권한 분리(최소 권한 원칙)** 설계
- **모든 트랜잭션에 타임스탬프와 행위자 주소를 기록**하여 부인 방지 및 감사 추적성 보장
- Hardhat 테스트 환경 구성 및 배포 스크립트 작성

### 🆔 DID 인증 시스템 (Hyperledger Indy / Aries)
- VON Network 기반 로컬 Indy 원장 구축 — **탈중앙화 신원 인증 인프라를 직접 구축**
- ACA-Py 에이전트 3개를 Docker 컨테이너로 구성, 에이전트 간 P2P 연결 및 Verifiable Credential 발급·검증 파이프라인 구현
- 중앙 서버(IdP)에 의존하지 않는 **자기 주권 신원(SSI, Self-Sovereign Identity)** 체계 설계 — 개인정보 유출 위험 최소화

### 🐳 인프라 & DevOps (Docker / Docker Compose)
- VON Network, ACA-Py 에이전트 3개, FastAPI 백엔드를 포함한 **멀티 컨테이너 환경을 Docker Compose로 오케스트레이션**
- **서비스 간 네트워크 격리**, 포트 매핑, 볼륨 관리 등 컨테이너 보안 기본 원칙 적용
- 로컬 개발부터 시연 환경까지 한 번의 명령어로 전체 시스템을 기동할 수 있는 환경 구성

### 📦 IPFS 분산 저장소
- 대용량 AIBOM 및 규제 서류를 IPFS에 분산 저장 — **단일 장애점(SPOF) 제거로 가용성 확보**
- 가스비 최적화를 위해 원본 데이터는 오프체인(IPFS), **무결성 증명값(CID)만 온체인에 기록하는 하이브리드 저장 전략** 구현
- 콘텐츠 주소 지정(Content-Addressable) 방식 활용 — **파일이 1비트라도 변경되면 CID가 달라지므로 위변조를 즉시 탐지** 가능

---

## 💡 프로젝트 배경 — AI 공급망의 보안 위협

최근 생성형 AI의 급격한 확산으로 AI 시스템의 안전성·신뢰성·투명성에 대한 사회적 요구가 급증하고 있습니다. 특히 의료 AI와 같은 고위험 분야에서는 엄격한 규제 승인이 필수적이지만, 현재의 프로세스는 수동적이고 보안 취약점이 존재합니다.

**핵심 보안 위협 3가지:**

| 보안 위협 | 현황 | iSBOMB의 보안 대응 |
|-----------|------|---------------------|
| **AIBOM 위변조 공격** | 중앙 집중식 저장소에 의존 → 내부자 위협 및 단일 장애점(SPOF) 존재 | 블록체인 불변성 + IPFS CID 해시 검증으로 **무결성(Integrity)** 보장 |
| **신원 위장 및 권한 탈취** | 중앙 IdP 기반 인증 → 서버 침해 시 전체 인증 체계 무력화 | W3C DID 표준 기반 분산 인증으로 **인증(Authentication)** 탈중앙화 |
| **승인 이력 조작 및 책임 회피** | 수동 승인 프로세스 → 감사 로그 부재, 책임 소재 불명확 | 모든 행위를 온체인 기록하여 **부인 방지(Non-repudiation)** 및 **감사 추적성** 확보 |

---

## 🏗 시스템 아키텍처 — Security by Design

iSBOMB는 **"Security by Design"** 원칙에 따라, 보안이 사후 대응이 아닌 **설계 단계부터 내재화**된 3계층 구조로 설계되었습니다.

```
┌─────────────────────────────────────────────────────────────────────┐
│         1. Application & Authentication Layer                       │
│         [보안 초점: 인증(Authentication) + 인가(Authorization)]       │
│  ┌────────────────────────┐  ┌────────────────────────────────────┐ │
│  │  Frontend Dashboard     │  │  DID Authentication                │ │
│  │  React / Next.js        │  │  Hyperledger Indy / Aries          │ │
│  │  역할별 접근 제어 UI     │  │  QR + VC 기반 탈중앙 인증           │ │
│  │  보안 이벤트 알림        │  │  자기 주권 신원(SSI) 구현           │ │
│  └────────────────────────┘  └────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│         2. Data Processing & Storage Layer                          │
│         [보안 초점: 무결성(Integrity) + 가용성(Availability)]         │
│  ┌────────────────────────┐  ┌────────────────────────────────────┐ │
│  │  FastAPI Backend        │  │  IPFS Distributed Storage          │ │
│  │  REST API + Webhook     │  │  CID 기반 무결성 자동 검증           │ │
│  │  보안 통신 파이프라인    │  │  분산 저장으로 SPOF 제거             │ │
│  └────────────────────────┘  └────────────────────────────────────┘ │
│  ┌────────────────────────┐                                         │
│  │  LLM Module (협업 파트) │                                         │
│  │  AI 문서 자동 생성       │                                         │
│  └────────────────────────┘                                         │
├─────────────────────────────────────────────────────────────────────┤
│         3. Blockchain Layer (On-Chain)                               │
│         [보안 초점: 부인 방지 + 감사 추적 + 최소 권한]                 │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Ethereum Smart Contract (Polygon Network)                   │    │
│  │  AIBOMRegistry.sol                                           │    │
│  │  역할별 접근 제어(RBAC) · 온체인 감사 로그 · 취약점 추적       │    │
│  │  모든 트랜잭션에 행위자 주소 + 타임스탬프 기록                  │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 핵심 기능

### 1. AIBOM 등록 및 무결성 앵커링
개발자가 AI 모델의 구성요소 명세서(AIBOM)를 IPFS에 업로드하면, 생성된 CID(해시값)를 블록체인에 영구 기록합니다. 이후 누구든 CID를 재계산하여 **원본과 1비트라도 다르면 즉시 위변조를 탐지**할 수 있습니다.

### 2. 규제 문서 제출 및 감사 추적
등록된 AIBOM에 대해 규제 기관 제출용 문서를 블록체인에 연결합니다. 각 문서의 IPFS CID·제출 시각·설명이 온체인에 투명하게 기록되어, **누가 언제 무엇을 제출했는지 감사 추적이 가능**합니다.

### 3. 검토 상태 라이프사이클 관리
AIBOM의 검토 상태를 `DRAFT → SUBMITTED → IN_REVIEW → APPROVED / REJECTED`의 명확한 생명주기로 관리합니다. 상태 전환은 **권한이 검증된 주체만 수행**할 수 있으며, 모든 변경 이력이 블록체인에 불변하게 남습니다.

### 4. DID 기반 분산 신원 인증
Hyperledger Aries를 통해 QR 코드 기반 보안 연결을 생성하고, **중앙 인증 서버 없이** 역할 기반 접근 제어(RBAC)를 수행합니다. 중앙 서버 침해에 의한 인증 체계 무력화 위험을 구조적으로 제거합니다.

### 5. 사후 시장 감시 — 취약점 보고 및 자문 기록
모델 출시 후에도 보안 취약점을 온체인으로 보고하고 추적할 수 있습니다. 취약점의 **심각도(severity)와 활성 상태(active)**를 관리하며, 감독자는 자문(Advisory)을 등록하여 권고 조치와 적용 범위를 투명하게 공개합니다.

### 6. 최소 권한 기반 접근 제어
OpenZeppelin `Ownable` 기반으로 기능별 권한을 분리하여, Owner·Supervisor·Developer 각각이 **최소한의 필요 권한만** 보유합니다. 무단 접근이나 권한 오남용을 스마트 컨트랙트 레벨에서 원천 차단합니다.

---

## 📄 스마트 컨트랙트 보안 설계 — `AIBOMRegistry.sol`

### 핵심 데이터 구조

| 구조체 | 역할 | 보안 관련 필드 |
|--------|------|---------------|
| `AIBOM` | AI 모델 메타데이터 | `owner`(행위자 추적), `cid`(무결성 검증), `timestamp`(시점 증명), `status`, `reviewReason` |
| `RegulatoryDossier` | 규제 문서 정보 | `cid`(무결성), `timestamp`(감사 추적), `description` |
| `Vulnerability` | 보안 취약점 기록 | `cid`, `severity`(위험도 분류), `timestamp`, `active`(현재 상태) |
| `Advisory` | 자문 및 권고 이력 | `cid`, `scope`(영향 범위), `action`(대응 조치), `reporter`(보고자 추적) |

### 접근 제어 설계 — 최소 권한 원칙 적용

```
┌──────────────────────────────────────────────────────┐
│                    Owner (컨트랙트 소유자)              │
│  - AIBOM 검토 상태 변경 (APPROVED / REJECTED)          │
│  - Supervisor 계정 추가/제거                           │
│  - 취약점 보고                                        │
├──────────────────────────────────────────────────────┤
│                    Supervisor (감독자)                  │
│  - 자문(Advisory) 등록                                 │
│  - 취약점 모니터링                                     │
├──────────────────────────────────────────────────────┤
│                    Developer (개발자)                   │
│  - AIBOM 등록                                         │
│  - 규제 문서 제출                                      │
│  - 본인 소유 AIBOM만 조회/수정                          │
└──────────────────────────────────────────────────────┘
```

### 상태 관리 (`ReviewStatus` Enum)

```solidity
enum ReviewStatus {
    DRAFT,       // 초안 — 외부 노출 전 단계
    SUBMITTED,   // 제출 완료 — 감사 로그 기록 시작
    IN_REVIEW,   // 검토 중 — 권한 있는 주체만 상태 전환 가능
    APPROVED,    // 승인 — 블록체인에 영구 기록
    REJECTED     // 반려 — 사유와 함께 기록, 추후 재제출 가능
}
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

<img width="619" height="106" alt="스크린샷 2026-02-09 오전 1 53 34" src="https://github.com/user-attachments/assets/3c80c0a7-d0d5-4dbc-bc4b-86baf9325730" />


생성된 AIBOM 및 문서를 IPFS에 업로드하고,반환된 CID(Content Identifier)를 블록체인에 등록합니다.

<img width="731" height="89" alt="스크린샷 2026-02-09 오전 1 52 02" src="https://github.com/user-attachments/assets/125b4419-a25f-4326-8607-f397fd9471c4" />


등록이 완료되면 다음과 같은 알림이 표시됩니다.

## 4. CID 검증 실패 화면

<img width="1011" height="238" alt="스크린샷 2026-02-09 오전 1 55 22" src="https://github.com/user-attachments/assets/1ecfa690-7088-48a4-aaee-619de88d6cd5" />

입력된 CID가 블록체인에 등록된 값과 일치하지 않을 경우,검증 실패 메시지가 사용자에게 표시됩니다.

## 5. 취약점 보고 및 알림

<img width="1002" height="621" alt="스크린샷 2026-02-09 오전 1 56 47" src="https://github.com/user-attachments/assets/0e104953-cbf7-4cbb-907e-90dc06586af3" />

보안 취약점이 보고되면,해당 취약점의 영향을 받는 당사자에게 대시보드 알림으로 표시됩니다.

<img width="980" height="81" alt="스크린샷 2026-02-09 오전 1 56 31" src="https://github.com/user-attachments/assets/a355c8d2-a659-4841-9cd2-674eb58c6ec3" />

---

## 🐛 트러블슈팅 (Troubleshooting)

### 1. ACA-Py 에이전트 간 DID 연결 실패 — 보안 통신 파이프라인 문제

**증상:** QR 코드 스캔 후 에이전트 간 Connection이 `active` 상태로 전환되지 않음

**원인 분석 과정:**
- ACA-Py Admin API(`localhost:9081/swagger`)에서 connection 상태를 직접 조회 → `invitation` 단계에서 멈춰 있는 것을 확인
- 에이전트 로그 분석 결과, **Webhook 콜백 URL이 Docker 내부 네트워크와 불일치**하여 상태 변경 이벤트가 백엔드로 전달되지 않는 문제 발견
- 이 문제는 에이전트 간 보안 핸드셰이크가 완료되지 않아 Credential 발급 자체가 불가능한 상황을 야기

**해결:**
- `docker-compose.yml`에서 각 에이전트의 `--webhook-url` 파라미터를 Docker 내부 네트워크 주소로 수정 (예: `http://backend:8000/webhook/developer`)
- 에이전트 시작 순서를 조정하여 VON Network가 완전히 초기화된 후 에이전트가 기동되도록 `depends_on` 및 헬스체크 조건 추가
- **교훈:** 분산 인증 시스템에서는 서비스 간 통신 경로의 정합성이 보안 체인 전체의 신뢰성을 좌우함

### 2. IPFS CID 불일치로 인한 무결성 검증 실패

**증상:** 동일한 파일을 IPFS에 업로드했음에도 CID 값이 달라져 블록체인 검증이 실패

**원인 분석 과정:**
- IPFS의 CID 생성은 chunking 알고리즘과 hashing 알고리즘에 의존 → 동일 파일이라도 노드 설정이 다르면 다른 CID가 생성될 수 있음을 파악
- 이는 **무결성 검증의 근간인 해시 일관성이 깨지는 심각한 보안 문제**임을 인식

**해결:**
- CID 생성 시 `--cid-version 1 --hash sha2-256`으로 고정하여 결정적(deterministic) CID 생성 보장
- 업로드 직후 반환된 CID를 즉시 블록체인에 기록하는 **원자적(atomic) 플로우**로 변경하여 CID 불일치 가능성 제거
- **교훈:** 무결성 검증 시스템에서 해시 생성의 결정성(determinism)은 반드시 보장되어야 하며, 이를 위한 파라미터 고정은 필수

### 3. Hardhat 로컬 노드와 프론트엔드 연동 문제

**증상:** 프론트엔드에서 스마트 컨트랙트 호출 시 `could not detect network` 에러 발생

**원인 분석 과정:**
- MetaMask와 Hardhat 로컬 노드의 Chain ID 불일치를 확인
- Ethers.js의 Provider 연결 로그를 분석하여 네트워크 감지 실패 원인 파악

**해결:**
- Hardhat 설정(`hardhat.config.ts`)에서 `chainId: 31337`을 명시적으로 설정
- 프론트엔드의 네트워크 설정을 Hardhat 로컬 노드와 일치시킴
- 컨트랙트 재배포 후 ABI와 컨트랙트 주소를 프론트엔드에 반영하는 자동화 스크립트 작성
- **교훈:** Web3 환경에서 네트워크 설정 불일치는 트랜잭션 실패의 주요 원인이며, 배포 파이프라인에서 설정 동기화를 자동화해야 함

### 4. Docker 서비스 간 네트워크 격리 및 포트 충돌

**증상:** `docker-compose up -d` 실행 시 일부 컨테이너가 시작되지 않거나 즉시 종료됨

**원인 분석 과정:**
- `docker-compose logs` 명령으로 개별 서비스 로그를 확인하여 에러 메시지 식별
- 호스트의 다른 프로세스가 동일 포트(8000, 9080, 9700 등)를 점유하고 있어 바인딩 실패

**해결:**
- `lsof -i :<port>` 명령으로 충돌 포트를 점유 중인 프로세스를 확인하고 종료
- `docker-compose down --volumes`로 컨테이너와 볼륨을 완전 제거 후 재기동
- `.env` 파일에서 외부 노출 포트를 변경하여 충돌 회피, 내부 서비스 간 통신은 Docker 내부 네트워크로 격리
- **교훈:** 멀티 서비스 환경에서는 네트워크 격리와 포트 관리 전략이 서비스 가용성의 핵심

### 5. 프론트엔드 의존성 충돌 — Web3 라이브러리 버전 호환성

**증상:** `yarn install` 또는 `yarn dev` 실행 시 패키지 버전 충돌 에러 발생

**원인 분석 과정:**
- ethers.js v5와 v6의 API 호환성 문제 파악 — Provider/Signer 인터페이스가 완전히 변경됨
- `yarn.lock`에 고정된 버전과 실제 설치된 버전의 불일치 확인

**해결:**
- `node_modules` 및 `yarn.lock`을 삭제 후 `yarn install`로 의존성 트리를 클린 재구성
- ethers.js v5 API에 맞춰 Provider/Signer 코드를 통일하고, `package.json`에서 정확한 버전을 명시(`~` 대신 고정 버전)
- **교훈:** 보안과 직결되는 Web3 라이브러리는 버전을 엄격히 고정해야 하며, 예기치 않은 업데이트로 인한 동작 변경을 방지해야 함

---
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


## ⚙️ 설치 및 실행

### 사전 요구사항
- [Docker](https://www.docker.com/get-started) & Docker Compose
- [Node.js](https://nodejs.org/) v18 이상
- [Yarn](https://yarnpkg.com/)

### 1단계: 저장소 복제
```bash
git clone https://github.com/minchaeki/iSBOMB.git
cd iSBOMB
```

### 2단계: 백엔드 서비스 기동 (Docker Compose)
```bash
docker-compose up -d
```
VON Network, ACA-Py 에이전트 3개, FastAPI 백엔드가 한 번에 기동됩니다.

### 3단계: 블록체인 로컬 노드 실행 및 컨트랙트 배포
```bash
cd blockchain
npm install
npx hardhat node          # 터미널 1: 로컬 노드 실행 (유지)
```
```bash
cd blockchain
npx hardhat run scripts/deploy.ts --network localhost   # 터미널 2: 컨트랙트 배포
```

### 4단계: 프론트엔드 실행
```bash
cd frontend
yarn install
yarn dev
```

### 접속 정보

| 서비스 | URL |
|--------|-----|
| 프론트엔드 | http://localhost:3000 |
| 백엔드 API (Swagger) | http://localhost:8000/docs |
| VON Network 원장 브라우저 | http://localhost:9700 |
| Hardhat 로컬 EVM | http://127.0.0.1:8545 |
| Developer Agent Admin | http://localhost:9081/swagger |
| Regulator Agent Admin | http://localhost:9181/swagger |
| Supervisor Agent Admin | http://localhost:9281/swagger |

---

## 📂 프로젝트 구조

```
iSBOMB/
├── frontend/           # Next.js 프론트엔드 (React, TailwindCSS)
│   ├── pages/          # 페이지 라우팅 (역할별 대시보드)
│   ├── components/     # 재사용 컴포넌트 (인증 UI, 알림, 검증 등)
│   └── utils/          # Web3 연동, DID 인증 유틸리티
├── backend/            # FastAPI 백엔드
│   ├── routes/         # API 엔드포인트
│   ├── services/       # 비즈니스 로직 (AIBOM 등록, 검증 등)
│   └── webhooks/       # ACA-Py 에이전트 Webhook 핸들러 (보안 통신)
├── blockchain/         # Hardhat 프로젝트
│   ├── contracts/      # Solidity 스마트 컨트랙트 (접근 제어, 감사 로그)
│   ├── scripts/        # 배포 스크립트
│   └── test/           # 컨트랙트 보안 테스트
├── docker-compose.yml  # 멀티 컨테이너 오케스트레이션
└── README.md
```

---

## ✒️ 코드 컨벤션

| 영역 | 도구 | 규칙 |
|------|------|------|
| Python (Backend) | `black`, `ruff` | PEP 8 준수, `black .`으로 포매팅, `ruff check .`으로 린트 |
| TypeScript/JS (Frontend) | ESLint, Prettier | `prettier --write .`으로 포매팅, `eslint .`으로 린트 |
| Solidity (Blockchain) | `solhint` | Solidity Style Guide 준수 |

---

## 🔮 향후 개선 계획

### 단기 개선 (1~3개월)
- **보안 테스트 강화:** 스마트 컨트랙트 퍼징(Fuzzing) 테스트 및 정적 분석(Slither/Mythril) 도입으로 취약점 사전 탐지
- **CI/CD 보안 파이프라인:** GitHub Actions에 보안 스캔(Dependabot, CodeQL) 통합, 컨트랙트 배포 전 자동 보안 감사
- **API 보안 강화:** JWT 기반 인증 토큰 도입, Rate Limiting, 입력값 검증(Input Validation) 강화
- **프론트엔드 보안:** XSS 방지, CSP(Content Security Policy) 헤더 적용, 민감 데이터 클라이언트 노출 방지

### 중기 개선 (3~6개월)
- **영지식 증명(ZKP) 도입:** ZK-SNARK/ZK-STARK를 적용하여 민감한 AIBOM 데이터의 **기밀성(Confidentiality)**을 보호하면서도 무결성 검증 가능
- **국제 표준 호환성:** SPDX, CycloneDX 등 기존 SBOM 국제 보안 표준과의 상호 변환 기능 구현
- **보안 모니터링 대시보드:** 블록체인 트랜잭션 이상 탐지, IPFS 노드 헬스 모니터링, 비정상 접근 패턴 알림 시스템
- **스마트 컨트랙트 업그레이드 패턴:** Proxy 패턴 도입으로 보안 취약점 발견 시 컨트랙트 로직 업데이트 가능한 구조 확보

### 장기 비전 (6개월~)
- **멀티체인 보안:** Polygon 외 Arbitrum, Optimism 등 L2 네트워크 확장, 크로스체인 무결성 검증
- **DAO 기반 보안 거버넌스:** 규제 승인 프로세스를 탈중앙화 자율 조직(DAO) 기반 투표로 전환, 거버넌스 공격 방어 메커니즘 설계
- **퍼블릭 테스트넷 배포 및 보안 감사:** Polygon 테스트넷 배포 후 외부 보안 감사(Audit) 수행

---

## 🚀 기대 효과

- **AI 공급망 보안 강화:** AIBOM 위변조를 블록체인 + IPFS 이중 검증으로 원천 차단, 공급망 전체의 신뢰성 확보
- **규제 준수 비용 절감:** 수동 승인 프로세스를 자동화하여 컴플라이언스 비용과 시간을 대폭 절감
- **투명한 보안 감사:** AI 모델 생애주기 전반의 모든 행위를 온체인에 기록하여 감사 추적성 및 책임 소재 명확화
- **인증 보안 강화:** DID 기반 분산 인증으로 중앙 서버 침해에 의한 인증 체계 무력화 위험 구조적 제거
- **확장 가능한 보안 아키텍처:** Security by Design 원칙에 따른 계층 분리 설계로 향후 보안 기능 추가 용이

---

  ## 📄 논문 정보 (Publication)

본 프로젝트는 **단순 구현 사례가 아니라**,직접 설계·구현한 시스템을 기반으로 **학술 논문으로 확장**한 연구 결과입니다.

### 🏛 학회 정보
- **학회명:** ICACT 
- **발표 연도:** 2026

### 📝 논문 제목
> **A Blockchain-based Governance Framework for AIBOM Integrity and Automated Regulatory Compliance**

### 📎 논문 PDF
👉 [A Blockchain-based Governance Framework for AIBOM Integrity and Automated Regulatory Compliance.pdf](https://github.com/user-attachments/files/25172522/A.Blockchain-based.Governance.Framework.for.AIBOM.Integrity.and.Automated.Regulatory.Compliance.pdf)




---
