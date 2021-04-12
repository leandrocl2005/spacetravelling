import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import Prismic from '@prismicio/client';
import { RiCalendarLine, RiTimerLine, RiUserLine } from 'react-icons/ri';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return format(dateObj, 'dd MMM yyyy', {
    locale: ptBR,
  });
}

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const timeToRead = useMemo(() => {
    const result = post.data.content.reduce(
      (acc, content) =>
        acc +
        content.body
          .map(body => body.text.split(' ').length)
          .reduce((a, b) => a + b),
      0
    );
    return Math.ceil(result / 200);
  }, [post]);

  if (router.isFallback) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <>
      <Header />
      <div className={styles.bannerContainer}>
        <img src={post.data.banner.url} alt={post.data.title} />
      </div>
      <div className={styles.postContainer}>
        <h1>{post.data.title}</h1>

        <div className={commonStyles.dateUserContainer}>
          <p>
            <RiCalendarLine />{' '}
            <span>{formatDate(post.first_publication_date)}</span>
          </p>
          <p>
            <RiUserLine /> <span>{post.data.author}</span>
          </p>
          <p>
            <RiTimerLine /> <span>{timeToRead} min</span>
          </p>
        </div>

        {post.data.content.map(content => (
          <div key={content.heading}>
            <h2>{content.heading}</h2>
            <div
              className={styles.bodyContainer}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(content.body),
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts')
  );

  return {
    fallback: true,
    paths: posts.results.map(post => ({
      params: { slug: post.uid },
    })),
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  return {
    props: { post: response },
  };
};
