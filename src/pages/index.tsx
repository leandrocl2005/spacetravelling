import { RiCalendarLine, RiUserLine } from 'react-icons/ri';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCallback, useState } from 'react';
import Link from 'next/link';

import { GetStaticProps } from 'next';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return format(dateObj, 'dd MMM yyyy', {
    locale: ptBR,
  });
}

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface StaticProps {
  props: {
    postsPagination: PostPagination;
  };
  preview: boolean;
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(() => postsPagination.results);
  const [nextPage, setNextPage] = useState<string | null>(
    () => postsPagination.next_page
  );

  const handleNextPageClick = useCallback(async () => {
    const response = await fetch(nextPage);

    const data = await response.json();

    const formattedPosts = data.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts(current => [...current, ...formattedPosts]);
    setNextPage(data.next_page);
  }, [nextPage]);

  return (
    <>
      <Header />
      <main>
        {posts.map(post => (
          <Link href={`post/${post.uid}`} key={post.uid}>
            <div className={styles.postContainer}>
              <h2>{post.data.title}</h2>

              <h3>{post.data.subtitle}</h3>
              <div className={commonStyles.dateUserContainer}>
                <p>
                  <RiCalendarLine />{' '}
                  <span>{formatDate(post.first_publication_date)}</span>
                </p>
                <p>
                  <RiUserLine /> <span>{post.data.author}</span>
                </p>
              </div>
            </div>
          </Link>
        ))}

        {nextPage && (
          <button
            type="button"
            className={styles.loadPosts}
            onClick={handleNextPageClick}
          >
            Carregar mais posts
          </button>
        )}
      </main>

      {preview && (
        <div className={commonStyles.previewModeButton}>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </div>
      )}
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 2,
      ref: previewData?.ref ?? null,
    }
  );

  // format posts
  const formattedPosts = response.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: response.next_page,
        results: formattedPosts,
      },
      preview,
    },
  };
};
