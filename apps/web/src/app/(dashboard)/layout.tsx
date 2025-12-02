import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

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
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-linkedin-blue rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Li</span>
                </div>
                <span className="font-semibold text-gray-800 hidden sm:block">
                  LinkedIn AI
                </span>
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <NavLink href="/dashboard">Dashboard</NavLink>
                <NavLink href="/compose">Compose</NavLink>
                <NavLink href="/drafts">Drafts</NavLink>
                <NavLink href="/calendar">Calendar</NavLink>
                <NavLink href="/templates">Templates</NavLink>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/compose"
                className="btn-primary btn-sm hidden sm:flex"
              >
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
      <nav className="md:hidden bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <MobileNavLink href="/dashboard">Dashboard</MobileNavLink>
          <MobileNavLink href="/compose">Compose</MobileNavLink>
          <MobileNavLink href="/drafts">Drafts</MobileNavLink>
          <MobileNavLink href="/calendar">Calendar</MobileNavLink>
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
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1"
    >
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
      <button className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-linkedin-blue flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </button>
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 hidden group-hover:block">
        <div className="px-4 py-2 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
          <p className="text-xs text-gray-500 truncate">{email}</p>
        </div>
        <Link
          href="/settings"
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Settings
        </Link>
        <Link
          href="/settings/billing"
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Billing
        </Link>
        <hr className="my-1" />
        <a
          href="/api/auth/logout"
          className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          Sign out
        </a>
      </div>
    </div>
  );
}
