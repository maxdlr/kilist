import {
  Arcade as ArcadeBase,
  ArrowDown as ArrowDownBase,
  ArrowLeft as ArrowLeftBase,
  ArrowRight as ArrowRightBase,
  Barcode as BarcodeBase,
  BellOff as BellOffBase,
  Cart as CartBase,
  Check as CheckBase,
  CheckCircle as CheckCircleBase,
  Clock as ClockBase,
  CloudXmark as CloudXmarkBase,
  EditPencil as EditPencilBase,
  Eye as EyeBase,
  EyeClosed as EyeClosedBase,
  HelpCircle as HelpCircleBase,
  HelpCircleSolid as HelpCircleSolidBase,
  HomeSimple as HomeBase,
  InfoCircle as InfoCircleBase,
  InfoCircleSolid as InfoCircleSolidBase,
  List as ListBase,
  Mail as MailBase,
  NavArrowDown as NavArrowDownBase,
  NavArrowLeft as NavArrowLeftBase,
  NavArrowRight as NavArrowRightBase,
  Play as PlayBase,
  PlaySolid as PlaySolidBase,
  Plus as PlusBase,
  QrCode as QrCodeBase,
  Refresh as RefreshBase,
  Search as SearchBase,
  Settings as SettingsBase,
  Sparks as SparksBase,
  Trash as TrashBase,
  Undo as UndoBase,
  User as UserBase,
  UserPlus as UserPlusBase,
  WarningCircle as WarningCircleBase,
  Wrench as WrenchBase,
  Xmark as XmarkBase,
} from "iconoir-react-native";
import { type ComponentType, type ReactNode, useId } from "react";
import Svg, { Circle, Defs, Mask, Path, Rect, type SvgProps } from "react-native-svg";

export type IconProps = { size: number; color: string; strokeWidth?: number };
export type Icon = ComponentType<IconProps>;

const DEFAULT_STROKE = 1.6;

const sized = (Base: ComponentType<SvgProps>): Icon => {
  const Sized = ({ size, color, strokeWidth = DEFAULT_STROKE }: IconProps) => (
    <Base width={size} height={size} color={color} strokeWidth={strokeWidth} />
  );
  return Sized;
};

export const ArcadeIcon = sized(ArcadeBase);
export const ArrowDownIcon = sized(ArrowDownBase);
export const ArrowLeftIcon = sized(ArrowLeftBase);
export const ArrowRightIcon = sized(ArrowRightBase);
export const BarcodeIcon = sized(BarcodeBase);
export const BellOffIcon = sized(BellOffBase);
export const CartIcon = sized(CartBase);
export const CheckIcon = sized(CheckBase);
export const CheckCircleIcon = sized(CheckCircleBase);
export const ClockIcon = sized(ClockBase);
export const CloudXmarkIcon = sized(CloudXmarkBase);
export const EditPencilIcon = sized(EditPencilBase);
export const EyeIcon = sized(EyeBase);
export const EyeClosedIcon = sized(EyeClosedBase);
export const HelpCircleIcon = sized(HelpCircleBase);
export const HelpCircleSolidIcon = sized(HelpCircleSolidBase);
export const HomeIcon = sized(HomeBase);
export const InfoCircleIcon = sized(InfoCircleBase);
export const InfoCircleSolidIcon = sized(InfoCircleSolidBase);
export const ListIcon = sized(ListBase);
export const MailIcon = sized(MailBase);
export const NavArrowLeftIcon = sized(NavArrowLeftBase);
export const NavArrowDownIcon = sized(NavArrowDownBase);
export const NavArrowRightIcon = sized(NavArrowRightBase);
export const PlayIcon = sized(PlayBase);
export const PlusIcon = sized(PlusBase);
export const QrCodeIcon = sized(QrCodeBase);
export const RefreshIcon = sized(RefreshBase);
export const SearchIcon = sized(SearchBase);
export const SettingsIcon = sized(SettingsBase);
export const SparksIcon = sized(SparksBase);
export const TrashIcon = sized(TrashBase);
export const UndoIcon = sized(UndoBase);
export const UserIcon = sized(UserBase);
export const UserPlusIcon = sized(UserPlusBase);
export const WarningCircleIcon = sized(WarningCircleBase);
export const WrenchIcon = sized(WrenchBase);
export const XmarkIcon = sized(XmarkBase);
export const PlaySolidIcon = sized(PlaySolidBase);

const SOLID_STROKE = 1.6;
const BOLD_STROKE = 2.4;

const line = { strokeLinecap: "round", strokeLinejoin: "round" } as const;

const solid = (draw: (color: string, mask: string) => ReactNode, hole?: ReactNode): Icon => {
  const Solid = ({ size, color }: IconProps) => {
    const id = `hole${useId().replace(/:/g, "")}`;
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {hole && (
          <Defs>
            <Mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={24} height={24}>
              <Rect width={24} height={24} fill="white" />
              {hole}
            </Mask>
          </Defs>
        )}
        {draw(color, hole ? `url(#${id})` : "")}
      </Svg>
    );
  };
  return Solid;
};

export const HomeSolidIcon = solid(
  (color, mask) => (
    <Path
      mask={mask}
      fill={color}
      stroke={color}
      strokeWidth={SOLID_STROKE}
      {...line}
      d="M17 21H7C4.79086 21 3 19.2091 3 17V10.7076C3 9.30887 3.73061 8.01175 4.92679 7.28679L9.92679 4.25649C11.2011 3.48421 12.7989 3.48421 14.0732 4.25649L19.0732 7.28679C20.2694 8.01175 21 9.30887 21 10.7076V17C21 19.2091 19.2091 21 17 21Z"
    />
  ),
  <Path d="M9 17H15" stroke="black" strokeWidth={SOLID_STROKE} {...line} />,
);

export const CartSolidIcon = solid((color) => (
  <>
    <Path fill={color} stroke={color} strokeWidth={SOLID_STROKE} {...line} d="M5 4H22L20 15H7L5 4Z" />
    <Path stroke={color} strokeWidth={SOLID_STROKE} {...line} d="M5 4C4.83333 3.33333 4 2 2 2" />
    <Path stroke={color} strokeWidth={SOLID_STROKE} {...line} d="M20 15H7H5.23077C3.44646 15 2.5 15.7812 2.5 17C2.5 18.2188 3.44646 19 5.23077 19H19.5" />
    <Circle cx={19.5} cy={20.5} r={1.9} fill={color} />
    <Circle cx={9.5} cy={20.5} r={1.9} fill={color} />
  </>
));

export const SettingsSolidIcon = solid(
  (color, mask) => (
    <Path
      mask={mask}
      fill={color}
      stroke={color}
      strokeWidth={SOLID_STROKE}
      {...line}
      d="M19.6224 10.3954L18.5247 7.7448L20 6L18 4L16.2647 5.48295L13.5578 4.36974L12.9353 2H10.981L10.3491 4.40113L7.70441 5.51596L6 4L4 6L5.45337 7.78885L4.3725 10.4463L2 11V13L4.40111 13.6555L5.51575 16.2997L4 18L6 20L7.79116 18.5403L10.397 19.6123L11 22H13L13.6045 19.6132L16.2551 18.5155C16.6969 18.8313 18 20 18 20L20 18L18.5159 16.2494L19.6139 13.598L21.9999 12.9772L22 11L19.6224 10.3954Z"
    />
  ),
  <Circle cx={12} cy={12} r={2.6} fill="black" />,
);

export const ListSolidIcon = solid((color) => (
  <>
    <Path stroke={color} strokeWidth={BOLD_STROKE} {...line} d="M8 6L20 6M8 12L20 12M8 18L20 18" />
    <Circle cx={4} cy={6} r={1.5} fill={color} />
    <Circle cx={4} cy={12} r={1.5} fill={color} />
    <Circle cx={4} cy={18} r={1.5} fill={color} />
  </>
));

export const WrenchSolidIcon = solid((color) => (
  <>
    <Path stroke={color} strokeWidth={BOLD_STROKE} {...line} d="M10.0503 10.6066L2.97923 17.6777C2.19818 18.4587 2.19818 19.725 2.97923 20.5061V20.5061C3.76027 21.2871 5.0266 21.2871 5.80765 20.5061L12.8787 13.435" />
    <Path
      fill={color}
      stroke={color}
      strokeWidth={SOLID_STROKE}
      {...line}
      d="M10.0502 10.6066C9.20638 8.45358 9.37134 5.6286 11.1109 3.88909C12.8504 2.14957 16.0606 1.76777 17.8284 2.82843L14.7877 5.8691L14.5051 8.98014L17.6161 8.69753L20.6568 5.65685C21.7175 7.42462 21.3357 10.6349 19.5961 12.3744C17.8566 14.1139 15.0316 14.2789 12.8786 13.435Z"
    />
  </>
));

const SHRUG_WIDTH = 120;
const SHRUG_ASPECT = 3;
const SHRUG_SCALE = 1.8;

export const ShrugIcon = ({ size, color, strokeWidth = DEFAULT_STROKE }: IconProps) => {
  const width = size * SHRUG_SCALE;
  return (
    <Svg
      width={width}
      height={width / SHRUG_ASPECT}
      viewBox={`0 0 ${SHRUG_WIDTH} ${SHRUG_WIDTH / SHRUG_ASPECT}`}
      fill="none"
      stroke={color}
      strokeWidth={(strokeWidth * SHRUG_WIDTH) / width}
      strokeLinejoin="miter"
    >
      <Path d="M2 7H12L22 31H32" />
      <Path d="M42 3Q30 20 42 37" />
      <Path d="M48 9L51 15M55 7L58 13" />
      <Path d="M67 9Q65 27 48 32" />
      <Path d="M74 3Q86 20 74 37" />
      <Path d="M84 31H94L104 7H118" />
    </Svg>
  );
};
