import Dialog from '../../dialog';

export default function ResultDialog({ closePath }: { closePath: string }) {
  return <Dialog kind="result" closePath={closePath} />;
}
