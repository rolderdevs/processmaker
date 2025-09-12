export interface Prompt {
  id: string;
  title: string;
  content: string;
  time: {
    created: string;
    updated: string;
  };
  isDefault?: boolean;
}
