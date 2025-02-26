interface ProcessButtonProps {
  onClick: () => void;
  disabled: boolean;
}

const ProcessButton = ({ onClick, disabled }: ProcessButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full py-4 rounded-lg text-lg font-semibold
        transition-all duration-200 transform
        ${
          disabled
            ? 'bg-purple-300 text-purple-500 cursor-not-allowed'
            : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.99] hover:shadow-lg'
        }
      `}
    >
      Process Files
    </button>
  );
};

export default ProcessButton;