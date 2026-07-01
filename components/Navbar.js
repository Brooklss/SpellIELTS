'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', id: 'nav-dashboard' },
  { href: '/practice', label: 'Practice', id: 'nav-practice' },
  { href: '/weak-words', label: 'Weak Words', id: 'nav-weak-words' },
  { href: '/progress', label: 'Progress', id: 'nav-progress' },
  { href: '/settings', label: 'Settings', id: 'nav-settings' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} role="navigation" aria-label="Main navigation">
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} id="nav-brand">
          <span className={styles.brandMark}>S</span>
          <span className={styles.brandName}>SpellIELTS</span>
        </Link>

        <ul className={styles.links}>
          {NAV_ITEMS.map(item => (
            <li key={item.href}>
              <Link
                href={item.href}
                id={item.id}
                className={`${styles.link} ${pathname === item.href ? styles.active : ''}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
