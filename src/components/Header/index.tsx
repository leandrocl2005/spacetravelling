import Link from 'next/link';
import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <header className={styles.headerContainer}>
      <Link href="/">
        <div className={styles.imageContainer}>
          <img src="/images/logo.png" alt="logo" width="40px" height="23px" />
        </div>
      </Link>
      <h1>
        spacetraveling<span>.</span>
      </h1>
    </header>
  );
}
