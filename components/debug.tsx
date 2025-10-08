export default function Pre(props: { value: any }) {
  return (
    <>
      <pre>{JSON.stringify(props.value, null, 2)}</pre>
    </>
  )
}
