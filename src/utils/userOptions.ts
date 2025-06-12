import type { UserData } from '@/types/users';

export const getDeveloperOptions = (users: UserData[]) =>
  users
    .filter(u => u.jobPosition === 'Developer')
    .map(u => ({
      value: u.userName,
      label: u.userName,
    }));

export const getBATestOptions = (users: UserData[]) =>
  users
    .filter(u =>
      u.jobPosition === 'Business Analyst' ||
      u.jobPosition === 'Tester'
    )
    .map(u => ({
      value: u.userName,
      label: u.userName,
    }));
