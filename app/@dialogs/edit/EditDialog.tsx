import Dialog from '../../dialog';

export default function EditDialog({ closePath }: { closePath: string }) {
  return <Dialog kind="edit" closePath={closePath} />;
}
