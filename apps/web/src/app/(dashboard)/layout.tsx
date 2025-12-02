import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  Gamepad2,
  LayoutDashboard,
  PenLine,
  FileText,
  Calendar,
  FileCode,
  Settings,
  CreditCard,
  LogOut,
  Plus,
  TrendingUp,
} from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.accountStatus === 'pending_payment') {
    redirect('/checkout');
  }

  return (
    <div className="min-h-screen bg-[#1a1c2c]">
      {/* Top Header */}
      <header className="bg-[#1a1c2c]/95 backdrop-blur border-b-4 border-[#f4f4f4] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div
                  className="w-10 h-10 bg-[#e43b44] border-4 border-[#f4f4f4] flex items-center justify-center"
                  style={{ boxShadow: '3px 3px 0 #0a0a0f' }}
                >
                  <Gamepad2 className="w-5 h-5 text-[#f4f4f4]" />
                </div>
                <span className="font-pixel text-xs text-[#f4f4f4] text-shadow-pixel hidden sm:block">
                  LinAI
                </span>
              </Link>
              <nav className="hidden md:flex items-center gap-2">
                <NavLink href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>
                  Dashboard
                </NavLink>
                <NavLink href="/compose" icon={<PenLine className="w-4 h-4" />}>
                  Compose
                </NavLink>
                <NavLink href="/drafts" icon={<FileText className="w-4 h-4" />}>
                  Drafts
                </NavLink>
                <NavLink href="/calendar" icon={<Calendar className="w-4 h-4" />}>
                  Calendar
                </NavLink>
                <NavLink href="/engagement" icon={<TrendingUp className="w-4 h-4" />}>
                  Engagement
                </NavLink>
                <NavLink href="/templates" icon={<FileCode className="w-4 h-4" />}>
                  Templates
                </NavLink>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/compose"
                className="hidden sm:flex items-center gap-2 font-retro text-lg bg-[#63c74d] hover:bg-[#4da63a] text-[#1a1c2c] border-4 border-[#f4f4f4] px-4 py-2 transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
                style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
              >
                <Plus className="w-4 h-4" />
                New Post
              </Link>
              <UserMenu
                name={session.name}
                email={session.email}
                imageUrl={session.profileImageUrl}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-[#262b44] border-b-4 border-[#3a4466] px-2 py-2">
        <div className="flex justify-around">
          <MobileNavLink href="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />}>
            Home
          </MobileNavLink>
          <MobileNavLink href="/compose" icon={<PenLine className="w-5 h-5" />}>
            Create
          </MobileNavLink>
          <MobileNavLink href="/drafts" icon={<FileText className="w-5 h-5" />}>
            Drafts
          </MobileNavLink>
          <MobileNavLink href="/calendar" icon={<Calendar className="w-5 h-5" />}>
            Calendar
          </MobileNavLink>
          <MobileNavLink href="/engagement" icon={<TrendingUp className="w-5 h-5" />}>
            Stats
          </MobileNavLink>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  children,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 font-retro text-lg text-[#94a3b8] hover:text-[#feae34] px-3 py-2 transition-colors hover:bg-[#262b44]"
    >
      {icon}
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 font-retro text-base text-[#94a3b8] hover:text-[#feae34] px-3 py-2 transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}

function UserMenu({
  name,
  email,
  imageUrl,
}: {
  name: string;
  email: string;
  imageUrl?: string | null;
}) {
  return (
    <div className="relative group">
      <button className="flex items-center gap-2 p-1 border-4 border-[#f4f4f4] bg-[#262b44] hover:bg-[#3a4466] transition-colors">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-8 h-8"
          />
        ) : (
          <div className="w-8 h-8 bg-[#0099db] flex items-center justify-center">
            <span className="text-[#f4f4f4] font-pixel text-[8px]">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </button>
      <div
        className="absolute right-0 mt-2 w-56 bg-[#262b44] border-4 border-[#f4f4f4] py-1 hidden group-hover:block z-50"
        style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
      >
        <div className="px-4 py-3 border-b-2 border-[#3a4466]">
          <p className="font-retro text-lg text-[#f4f4f4] truncate">{name}</p>
          <p className="font-retro text-base text-[#94a3b8] truncate">{email}</p>
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-2 font-retro text-lg text-[#f4f4f4] hover:bg-[#3a4466] transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <Link
          href="/settings/billing"
          className="flex items-center gap-3 px-4 py-2 font-retro text-lg text-[#f4f4f4] hover:bg-[#3a4466] transition-colors"
        >
          <CreditCard className="w-4 h-4" />
          Billing
        </Link>
        <div className="border-t-2 border-[#3a4466] mt-1 pt-1">
          <a
            href="/api/auth/logout"
            className="flex items-center gap-3 px-4 py-2 font-retro text-lg text-[#e43b44] hover:bg-[#3a4466] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </a>
        </div>
      </div>
    </div>
  );
}
