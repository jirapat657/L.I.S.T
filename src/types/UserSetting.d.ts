export type UserSettingProps = {
  email: string;
  permission: string;
  password: string;
  confirm: string;
  active: boolean;
  docId?: string;
};

export interface ProfileProps {
  createdAt: Date;
  createdBy?: string;
  email: string;
  username?: string;
  active: boolean;
  permission: string;
}
