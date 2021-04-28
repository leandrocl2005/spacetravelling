import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import Prismic from '@prismicio/client';
import { RiCalendarLine, RiTimerLine, RiUserLine } from 'react-icons/ri';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import Link from 'next/link';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';
import { Comments } from '../../components/Comments';

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return format(dateObj, 'dd MMM yyyy', {
    locale: ptBR,
  });
}

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  uid?: string;
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
  prevPost: Post;
  nextPost: Post;
  preview: boolean;
}

export default function Post({
  post,
  prevPost,
  nextPost,
  preview,
}: PostProps): JSX.Element {
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
        {post.last_publication_date && (
          <div className={commonStyles.editedDate}>
            * editado em {formatDate(post.last_publication_date)}
          </div>
        )}

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

        <hr
          style={{
            color: '#d7d7d7',
            backgroundColor: '#d7d7d7',
            height: '1px',
            opacity: 0.1,
            marginTop: '60px',
            marginBottom: '48px',
          }}
        />

        <footer>
          <div className={styles.prevNext}>
            <div>
              {prevPost && (
                <>
                  <p>{prevPost.data.title}</p>
                  <Link href={`/post/${prevPost.uid}`}>
                    <a>Post anterior</a>
                  </Link>
                </>
              )}
            </div>

            <div>
              {nextPost && (
                <>
                  <p>{nextPost.data.title}</p>
                  <Link href={`/post/${nextPost.uid}`}>
                    <a>Próximo post</a>
                  </Link>
                </>
              )}
            </div>
          </div>

          <Comments />

          {preview && (
            <div className={commonStyles.previewModeButton}>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </div>
          )}
        </footer>
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

export const getStaticProps: GetStaticProps<PostProps> = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const prevPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      fetch: ['posts.title'],
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date desc]',
    })
  ).results[0];

  const nextPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      fetch: ['posts.title'],
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date]',
    })
  ).results[0];

  return {
    props: {
      post: response,
      prevPost: prevPost ?? null,
      nextPost: nextPost ?? null,
      preview,
    },
  };
};
