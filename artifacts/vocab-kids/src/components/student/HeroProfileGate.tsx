import { useState, type ReactNode } from "react";
import { NicknameSetup } from "@/components/student/NicknameSetup";
import { getOrCreateStudentId, useStudent } from "@/hooks/useStudent";

interface HeroProfileGateProps {
  children: ReactNode;
}

/**
 * 所有計分挑戰共用的英雄登錄守門流程。
 * 第一次進入時必須完成暱稱與動物頭像，之後會記住身分並直接開始。
 */
export function HeroProfileGate({ children }: HeroProfileGateProps) {
  const { student, setStudent } = useStudent();
  const [studentId] = useState(() => student?.id || getOrCreateStudentId());
  const hasProfile = Boolean(student?.nickname.trim());

  return (
    <>
      {hasProfile ? children : <div className="min-h-[100dvh] bg-gradient-to-br from-violet-100 via-pink-50 to-amber-50" />}
      <NicknameSetup
        open={!hasProfile}
        studentId={studentId}
        onSave={setStudent}
        title="加入單字英雄榜"
        description="先選動物夥伴和英雄暱稱，完成挑戰後就會自動登上排行榜！"
        submitLabel="完成登錄，開始挑戰！"
      />
    </>
  );
}
