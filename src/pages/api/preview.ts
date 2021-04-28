import { NextApiRequest, NextApiResponse } from 'next';

export default async (
  request: NextApiRequest,
  response: NextApiResponse
): Promise<void> => {
  response.clearPreviewData();

  response.writeHead(307, { Location: '/' });
  response.end();
};
