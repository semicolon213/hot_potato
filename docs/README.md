# Hot Potato ERP 문서

개발 단계별 산출물을 정리한 문서 모음입니다. 처음이라면 **역할별 시작점**부터 보세요.
기준 시점은 `main` @ `ffed6c7`(2025-12-01)입니다. 이후 개발은 [hot_potato_remake](https://github.com/semicolon213/hot_potato_remake)에서 이어집니다.

## 역할별 시작점

| 나는 | 먼저 읽을 문서 |
|---|---|
| 프로젝트를 처음 보는 사람 | [루트 README](../README.md) → [PROBLEM_DEFINITION](./PROBLEM_DEFINITION.md) → [ARCHITECTURE](./ARCHITECTURE.md) |
| 새로 합류한 개발자 | [GETTING_STARTED](./GETTING_STARTED.md) → [CONVENTIONS](./CONVENTIONS.md) → [ARCHITECTURE](./ARCHITECTURE.md) → [STATUS](./STATUS.md) |
| 기능을 추가하는 개발자 | [SRS](./SRS.md) → [API_SPEC](./API_SPEC.md) → [DATA_MODEL](./DATA_MODEL.md) |
| 운영자(조교·관리자) | [OPERATOR_MANUAL](./OPERATOR_MANUAL.md) → [RUNBOOK](./RUNBOOK.md) |
| 새 환경을 세팅하는 사람 | [DEPLOYMENT](./DEPLOYMENT.md) |

## 개발 단계별 산출물

```mermaid
flowchart LR
    S1["① 문제 정의"] --> S2["② 요구사항"] --> S3["③ 설계"] --> S4["④ 구조 생성"] --> S5["⑤ 구현"] --> S6["⑥ 테스트"] --> S7["⑦ 수정·문서화"]
```

| 단계 | 산출물 | UML 다이어그램 |
|---|---|---|
| ① 문제 정의 | [PROBLEM_DEFINITION](./PROBLEM_DEFINITION.md): 배경, 문제, 목표, KPI, 범위, 제약 | [Activity](./PROBLEM_DEFINITION.md#현행as-is-결재-흐름) (현행 결재 흐름) |
| ② 요구사항 | [SRS](./SRS.md): 액터, 사용자 스토리, 기능·비기능 요구사항(MoSCoW) · [GLOSSARY](./GLOSSARY.md) | [Use Case](./SRS.md#2-use-case-다이어그램) |
| ③ 설계 | [DATA_MODEL](./DATA_MODEL.md): ERD, Drive 구조 · [API_SPEC](./API_SPEC.md): 액션 명세 | [ERD](./DATA_MODEL.md#2-erd) · [Sequence](./ARCHITECTURE.md#4-sequence-다이어그램) · [Class](./ARCHITECTURE.md#5-class-다이어그램-프론트엔드-핵심-타입) |
| ④ 구조 생성 | [ARCHITECTURE](./ARCHITECTURE.md) · [ADR](./ADR.md): 결정 기록 · [CONVENTIONS](./CONVENTIONS.md): 코딩 규칙, 브랜치 전략 · [DEPLOYMENT](./DEPLOYMENT.md): 인프라, 배포 | [Component](./ARCHITECTURE.md#2-component-다이어그램) · [Deployment](./ARCHITECTURE.md#3-deployment-다이어그램) |
| ⑤ 구현 | 소스 코드 · [GETTING_STARTED](./GETTING_STARTED.md) · [STATUS](./STATUS.md): 구현 현황 | [State](./ARCHITECTURE.md#6-상태-다이어그램) (회원, 결재, 예산, 공지 고정) |
| ⑥ 테스트 | [TEST_PLAN](./TEST_PLAN.md): TC 시트, 자동 검사 결과, 결함 리포트 | [Communication](./ARCHITECTURE.md#7-communication-다이어그램-결재-승인) |
| ⑦ 수정·문서화 | [OPERATOR_MANUAL](./OPERATOR_MANUAL.md) · [RUNBOOK](./RUNBOOK.md): 장애 대응 · [SECURITY](./SECURITY.md) · [STATUS](./STATUS.md): 기술 백로그 | [Package](./ARCHITECTURE.md#8-package-다이어그램) |

## 문서 목록

| 문서 | 내용 |
|---|---|
| [PROBLEM_DEFINITION.md](./PROBLEM_DEFINITION.md) | 왜 만들었나, 무엇을 해결하나, 어떻게 측정하나 |
| [SRS.md](./SRS.md) | 누가 무엇을 할 수 있어야 하나 |
| [GLOSSARY.md](./GLOSSARY.md) | 업무·기술 용어 |
| [DATA_MODEL.md](./DATA_MODEL.md) | 스프레드시트·시트·열, Drive 폴더 구조 |
| [API_SPEC.md](./API_SPEC.md) | Apps Script 액션 68개 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 구성 요소, 배포 구조, 흐름, 상태, 패키지, 캐시 |
| [ADR.md](./ADR.md) | 설계 결정 14건과 그 이유 |
| [CONVENTIONS.md](./CONVENTIONS.md) | 브랜치, 커밋, 코드, Apps Script 규칙 |
| [GETTING_STARTED.md](./GETTING_STARTED.md) | 로컬 개발 환경 |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 처음부터 세팅, 변경 배포, 롤백 |
| [TEST_PLAN.md](./TEST_PLAN.md) | 테스트 전략, TC, 결과, 결함 |
| [STATUS.md](./STATUS.md) | 기능별 상태, 프로젝트 이력, 백로그 |
| [OPERATOR_MANUAL.md](./OPERATOR_MANUAL.md) | 운영자 작업 절차 |
| [RUNBOOK.md](./RUNBOOK.md) | 장애 유형별 대응 |
| [SECURITY.md](./SECURITY.md) | 인증, 권한, 데이터 보호, 신고 |
| [archive/](./archive/README.md) | 재정리 전 문서 (참고용) |

## 문서 관리 규칙

- 구현 상태는 [STATUS.md](./STATUS.md)에서만 관리합니다.
- 코드를 바꾸면 같은 커밋에서 관련 문서도 고칩니다.
- 다이어그램은 Mermaid로 문서 안에 씁니다.
