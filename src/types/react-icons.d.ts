// React 19 호환성을 위한 react-icons 타입 정의
// React 19에서 ReactNode가 string을 포함할 수 있어서 JSX 컴포넌트로 사용할 수 없는 문제를 해결하기 위해
// ReactElement를 반환하는 타입으로 명시적으로 정의

import type { ReactElement, SVGProps } from 'react';

type IconComponent = (props: SVGProps<SVGSVGElement>) => ReactElement;

declare module 'react-icons/fa' {
  export const FaUser: IconComponent;
  export const FaSignOutAlt: IconComponent;
  export const FaChevronLeft: IconComponent;
  export const FaChevronRight: IconComponent;
  export const FaChevronDown: IconComponent;
  export const FaPlus: IconComponent;
  export const FaFolderOpen: IconComponent;
  export const FaFile: IconComponent;
  export const FaFilter: IconComponent;
  export const FaTimes: IconComponent;
  export const FaFileAlt: IconComponent;
  export const FaUsers: IconComponent;
  export const FaLock: IconComponent;
  export const FaEdit: IconComponent;
  export const FaUpload: IconComponent;
  export const FaShare: IconComponent;
  export const FaTrash: IconComponent;
  export const FaTag: IconComponent;
  export const FaBullhorn: IconComponent;
  export const FaThumbtack: IconComponent;
  export const FaBook: IconComponent;
  export const FaWallet: IconComponent;
  export const FaChartLine: IconComponent;
  export const FaCheckCircle: IconComponent;
  export const FaTimesCircle: IconComponent;
  export const FaExclamationTriangle: IconComponent;
  export const FaInfoCircle: IconComponent;
  export const FaSync: IconComponent;
  export const FaExclamationCircle: IconComponent;
  export const FaPause: IconComponent;
  export const FaPlay: IconComponent;
  export const FaSearch: IconComponent;
  export const FaListUl: IconComponent;
  export const FaDownload: IconComponent;
  export const FaFileDownload: IconComponent;
  export const FaCheck: IconComponent;
  export const FaEnvelope: IconComponent;
  export const FaUserClock: IconComponent;
  export const FaUserCheck: IconComponent;
  export const FaUserTimes: IconComponent;
  export const FaPaperPlane: IconComponent;
  export const FaSpinner: IconComponent;
  export const FaPaperclip: IconComponent;
}

declare module 'react-icons/bi' {
  export const BiSolidBell: IconComponent;
  export const BiMessageSquareDetail: IconComponent;
  export const BiFileBlank: IconComponent;
  export const BiCalendar: IconComponent;
  export const BiUser: IconComponent;
  export const BiShield: IconComponent;
  export const BiChevronDown: IconComponent;
  export const BiSearchAlt2: IconComponent;
  export const BiEditAlt: IconComponent;
  export const BiTrashAlt: IconComponent;
  export const BiX: IconComponent;
  export const BiLoaderAlt: IconComponent;
  export const BiShareAlt: IconComponent;
  export const BiTrash: IconComponent;
  export const BiDotsVerticalRounded: IconComponent;
  export const BiPencil: IconComponent;
  export const BiPaperclip: IconComponent;
  export const BiSave: IconComponent;
  export const BiEdit: IconComponent;
  export const BiTable: IconComponent;
  export const BiStar: IconComponent;
  export const BiHelpCircle: IconComponent;
  export const BiPlus: IconComponent;
  export const BiDetail: IconComponent;
  export const BiGroup: IconComponent;
  export const BiChevronUp: IconComponent;
}

declare module 'react-icons/hi' {
  export const HiX: IconComponent;
}

declare module 'react-icons/hi2' {
  export const HiChatBubbleLeftRight: IconComponent;
  export const HiXMark: IconComponent;
  export const HiMiniMegaphone: IconComponent;
  export const HiMiniDocumentText: IconComponent;
  export const HiMiniCalendarDays: IconComponent;
  export const HiMiniUser: IconComponent;
  export const HiMiniShieldCheck: IconComponent;
  export const HiMiniSquares2X2: IconComponent;
  export const HiMiniCurrencyDollar: IconComponent;
}

declare module 'react-icons/go' {
  export const GoHomeFill: IconComponent;
}

declare module 'react-icons/si' {
  export const SiGoogle: IconComponent;
}

declare module 'react-icons/io' {
  export const IoMdClose: IconComponent;
}

declare module 'react-icons/io5' {
  export const IoSettingsSharp: IconComponent;
}
