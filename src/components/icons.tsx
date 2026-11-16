import {
  ArrowDown as ArrowDownBase,
  ArrowLeft as ArrowLeftBase,
  ArrowRight as ArrowRightBase,
  Barcode as BarcodeBase,
  Cart as CartBase,
  Check as CheckBase,
  CheckCircle as CheckCircleBase,
  Clock as ClockBase,
  EditPencil as EditPencilBase,
  HelpCircle as HelpCircleBase,
  HelpCircleSolid as HelpCircleSolidBase,
  HomeSimple as HomeBase,
  InfoCircle as InfoCircleBase,
  InfoCircleSolid as InfoCircleSolidBase,
  List as ListBase,
  Mail as MailBase,
  NavArrowLeft as NavArrowLeftBase,
  NavArrowRight as NavArrowRightBase,
  Play as PlayBase,
  Plus as PlusBase,
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
import type { ComponentType } from "react";
import type { SvgProps } from "react-native-svg";

export type IconProps = { size: number; color: string; strokeWidth?: number };
export type Icon = ComponentType<IconProps>;

const DEFAULT_STROKE = 1.6;

const sized = (Base: ComponentType<SvgProps>): Icon => {
  const Sized = ({ size, color, strokeWidth = DEFAULT_STROKE }: IconProps) => (
    <Base width={size} height={size} color={color} strokeWidth={strokeWidth} />
  );
  return Sized;
};

export const ArrowDownIcon = sized(ArrowDownBase);
export const ArrowLeftIcon = sized(ArrowLeftBase);
export const ArrowRightIcon = sized(ArrowRightBase);
export const BarcodeIcon = sized(BarcodeBase);
export const CartIcon = sized(CartBase);
export const CheckIcon = sized(CheckBase);
export const CheckCircleIcon = sized(CheckCircleBase);
export const ClockIcon = sized(ClockBase);
export const EditPencilIcon = sized(EditPencilBase);
export const HelpCircleIcon = sized(HelpCircleBase);
export const HelpCircleSolidIcon = sized(HelpCircleSolidBase);
export const HomeIcon = sized(HomeBase);
export const InfoCircleIcon = sized(InfoCircleBase);
export const InfoCircleSolidIcon = sized(InfoCircleSolidBase);
export const ListIcon = sized(ListBase);
export const MailIcon = sized(MailBase);
export const NavArrowLeftIcon = sized(NavArrowLeftBase);
export const NavArrowRightIcon = sized(NavArrowRightBase);
export const PlayIcon = sized(PlayBase);
export const PlusIcon = sized(PlusBase);
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
