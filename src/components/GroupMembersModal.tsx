'use client';

import { createPortal } from "react-dom";
import { User } from "../types";

interface GroupMembersModalProps {
  groupName: string;
  members: Array<User | string>;
  onClose: () => void;
}

function memberLabel(member: User | string) {
  return typeof member === "string" ? member : member.name;
}

function memberDetail(member: User | string) {
  return typeof member === "string" ? "Member ID" : member.phone;
}

function memberInitial(member: User | string) {
  return (typeof member === "string" ? member : member.name)
    .trim()
    .charAt(0)
    .toUpperCase() || "?";
}

export default function GroupMembersModal({
  groupName,
  members,
  onClose,
}: GroupMembersModalProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="flex max-h-[min(32rem,85vh)] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-members-title"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
              Group members
            </p>
            <h2
              id="group-members-title"
              className="mt-1 max-w-[15rem] truncate text-lg font-semibold text-gray-900 dark:text-white"
            >
              {groupName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Close member list"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="overflow-y-auto p-3">
          <p className="px-2 pb-2 text-xs text-gray-500 dark:text-gray-400">
            {members.length} {members.length === 1 ? "member" : "members"}
          </p>
          <ul className="space-y-1">
            {members.map((member, index) => (
              <li
                key={typeof member === "string" ? member : member._id || index}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-sm font-bold text-white">
                  {memberInitial(member)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {memberLabel(member)}
                  </span>
                  <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                    {memberDetail(member)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>,
    document.body,
  );
}
