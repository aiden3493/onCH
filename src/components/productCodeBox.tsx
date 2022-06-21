export default function ProductCodeBox(props: any) {
  const removeBox = (e: any) => {
    const pushData = props.productCodes.filter(
      (element: string) => element !== props.code
    );

    props.setProductCodes(pushData);
  };

  return (
    <div>
      <div
        key={props.code}
        className="pl-5 pr-3 w-full bg-white h-[40px] rounded flex justify-between items-center text-black"
      >
        <h1>{props.code}</h1>
        <div onClick={removeBox} className="cursor-pointer">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#DA0000"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
