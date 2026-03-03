import React from 'react';
import { Modal } from './Modal';

export const Dialog = Modal;
export const DialogTrigger = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const DialogContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const DialogHeader = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const DialogTitle = ({ children, ...props }: any) => <h2 className="text-xl font-semibold" {...props}>{children}</h2>;
