// React 19 호환성을 위한 react-icons 타입 정의
declare module 'react-icons/bi' {
  import { ComponentType, SVGProps } from 'react';
  
  export const BiSolidBell: ComponentType<SVGProps<SVGSVGElement>>;
  export const BiMessageSquareDetail: ComponentType<SVGProps<SVGSVGElement>>;
  export const BiFileBlank: ComponentType<SVGProps<SVGSVGElement>>;
  export const BiCalendar: ComponentType<SVGProps<SVGSVGElement>>;
  export const BiUser: ComponentType<SVGProps<SVGSVGElement>>;
  export const BiShield: ComponentType<SVGProps<SVGSVGElement>>;
  export const BiChevronDown: ComponentType<SVGProps<SVGSVGElement>>;
  export const BiSearchAlt2: ComponentType<SVGProps<SVGSVGElement>>;
  export const BiEditAlt: ComponentType<SVGProps<SVGSVGElement>>;
  export const BiTrashAlt: ComponentType<SVGProps<SVGSVGElement>>;
  export const BiX: ComponentType<SVGProps<SVGSVGElement>>;
  export const BiLoaderAlt: ComponentType<SVGProps<SVGSVGElement>>;
  export const BiShareAlt: ComponentType<SVGProps<SVGSVGElement>>;
  export const BiTrash: ComponentType<SVGProps<SVGSVGElement>>;
  export const BiDotsVerticalRounded: ComponentType<SVGProps<SVGSVGElement>>;
}

declare module 'react-icons/si' {
  import { ComponentType, SVGProps } from 'react';
  
  export const SiGoogle: ComponentType<SVGProps<SVGSVGElement>>;
}

declare module 'react-icons/io5' {
  import { ComponentType, SVGProps } from 'react';
  
  export const IoSettingsSharp: ComponentType<SVGProps<SVGSVGElement>>;
}
