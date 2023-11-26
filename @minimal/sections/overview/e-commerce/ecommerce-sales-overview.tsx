// @mui
import Stack from '@mui/material/Stack';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Card, { type CardProps } from '@mui/material/Card';
import LinearProgress from '@mui/material/LinearProgress';
import { styled } from '@mui/material'
// ----------------------------------------------------------------------

type ItemProps = {
  label: string;
  value: number;
  totalAmount: number;
};

interface Props extends CardProps {
  title?: string;
  subheader?: string;
  data: ItemProps[];
}

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 5
}));

export default function EcommerceSalesOverview({ title, subheader, data, ...other }: Props) {
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />

      <Stack spacing={4} sx={{ px: 3, pt: 3, pb: 5 }}>
        {data.map((progress) => (
          <ProgressItem key={progress.label} progress={progress} />
        ))}
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

type ProgressItemProps = {
  progress: ItemProps;
};

function ProgressItem({ progress }: ProgressItemProps) {
  return (
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center">
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          {progress.label}
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {progress.value} /&nbsp;
        </Typography>

        <Typography variant="subtitle2"> {progress.totalAmount}</Typography>
      </Stack>

      <BorderLinearProgress
        variant="determinate"
        value={progress.value}
        color={
          (progress.label === 'Total Income' && 'info') ||
          (progress.label === 'Total Expenses' && 'warning') ||
          'primary'
        }
      />
    </Stack>
  );
}
